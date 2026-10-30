"""Reproducible 2026 L11 noise and L14 polygon assignments.

Uses the existing requirements.txt. All random generators are local; the
archived Monte Carlo tables and SST results are not overwritten.
"""
from pathlib import Path
import argparse
import json
import numpy as np

ROOT = Path(__file__).resolve().parent


def spectral_shape(n, kappa):
    """Unit diagonal circulant covariance; f in cycles/sample, f0=1/n.

    This explicitly chosen finite Gaussian model is not a universal definition
    of flicker noise. There is no per-realization standard-deviation rescaling.
    """
    if not isinstance(n, (int, np.integer)) or n < 4 or not np.isfinite(kappa):
        raise ValueError("n >= 4 and finite kappa required")
    f = np.maximum(np.fft.rfftfreq(n), 1 / n)
    raw = np.exp(kappa * np.log(f))
    mult = np.full(len(f), 2.0)
    mult[0] = 1
    if n % 2 == 0:
        mult[-1] = 1
    s = raw / (mult @ raw / n)
    if not np.isfinite(s).all() or np.any(s <= 0):
        raise ValueError("nonpositive or nonfinite spectrum")
    return s, mult


def gaussian_noise(n, kappa, sigma, rng):
    if not np.isfinite(sigma) or sigma <= 0:
        raise ValueError("positive sigma required")
    spectrum, _ = spectral_shape(n, kappa)
    return sigma * np.fft.irfft(np.fft.rfft(rng.normal(size=n)) * np.sqrt(spectrum), n)


def spectral_fit(X, y, kappa):
    """Exact GLS for the declared finite circulant covariance, scale profiled.

    Returns beta, unit-scale quadratic form, shape logdet and information.
    The rFFT multiplicities count every real covariance eigenvalue once.
    """
    X, y = np.asarray(X, float), np.asarray(y, float)
    if X.ndim != 2 or y.ndim != 1 or X.shape[0] != len(y):
        raise ValueError("X(n,p), y(n) required")
    if not np.isfinite(X).all() or not np.isfinite(y).all() or np.linalg.matrix_rank(X) != X.shape[1]:
        raise ValueError("finite full-column-rank design required")
    spectrum, mult = spectral_shape(len(y), kappa)
    fx, fy = np.fft.rfft(X, axis=0), np.fft.rfft(y)
    weight = mult / spectrum
    info = np.real(fx.conj().T @ (weight[:, None] * fx)) / len(y)
    rhs = np.real(fx.conj().T @ (weight * fy)) / len(y)
    beta = np.linalg.solve(info, rhs)
    r = np.fft.rfft(y - X @ beta)
    q = float(np.sum(weight * abs(r) ** 2) / len(y))
    return beta, q, float(mult @ np.log(spectrum)), info


def polygon_values(points):
    p = np.asarray(points, float)
    if p.ndim != 2 or p.shape[1] != 2 or len(p) < 3 or not np.isfinite(p).all():
        raise ValueError("finite n by 2 polygon required")
    nxt, prev = np.roll(p, -1, axis=0), np.roll(p, 1, axis=0)
    edge = p - nxt
    lengths = np.linalg.norm(edge, axis=1)
    if np.min(lengths) < 1e-12:
        raise ValueError("coincident neighboring vertices")
    area = .5 * np.sum(p[:, 0] * nxt[:, 1] - p[:, 1] * nxt[:, 0])
    ga = .5 * np.column_stack([nxt[:, 1] - prev[:, 1], prev[:, 0] - nxt[:, 0]])
    gl = edge / lengths[:, None] + (p - prev) / np.roll(lengths, 1)[:, None]
    return float(area), float(lengths.sum()), ga, gl


def tangent_smoothing(p):
    prev, nxt = np.roll(p, 1, axis=0), np.roll(p, -1, axis=0)
    tangent = nxt - prev
    size = np.linalg.norm(tangent, axis=1)
    if np.min(size) < 1e-12:
        raise ValueError("undefined discrete tangent")
    tangent /= size[:, None]
    laplace = .5 * (prev + nxt) - p
    return np.sum(laplace * tangent, axis=1)[:, None] * tangent


def polygon_initial(n=17):
    if not isinstance(n, int) or n < 3:
        raise ValueError("integer n >= 3 required")
    # Match the course's seed-2026 legacy RandomState draw order.
    rng = np.random.RandomState(2026)
    angle = np.arange(n) * 2 * np.pi / n
    radius = np.array([1.3 + .3 * rng.rand() if i % 2 == 0 else .3 + .2 * rng.rand() for i in range(n)])
    radius *= 1 + .25 * np.sin(2 * angle + .8)
    return np.column_stack([radius * np.cos(angle), radius * np.sin(angle)])


def polygon_history(initial, alpha, smoothing, steps=45, safe=True, return_steps=False):
    """Course code: global gradient projection + tangent smoothing + rescale.

    Smooth directions alone are not an exact discrete perimeter constraint and
    do not guarantee no intersections. In safe mode, reject a self-intersecting
    step and halve its step size; return_steps exposes every accepted size.
    Finite steps are snapshots, not proof of convergence to a regular polygon.
    """
    if not np.isfinite([alpha, smoothing]).all() or alpha <= 0 or smoothing < 0:
        raise ValueError("alpha > 0, smoothing >= 0 required")
    if not isinstance(steps, int) or steps < 0:
        raise ValueError("nonnegative integer steps required")
    p = np.array(initial, dtype=float, copy=True)
    _, target, _, _ = polygon_values(p)
    frames = [p.copy()]
    accepted = []
    if safe and (polygon_values(p)[0] <= 0 or not is_simple(p)):
        raise ValueError("simple counterclockwise initial polygon required")
    for _ in range(steps):
        _, _, ga, gl = polygon_values(p)
        denom = np.sum(gl * gl)
        if denom < 1e-20:
            raise ValueError("degenerate perimeter gradient")
        direction = ga - np.sum(ga * gl) / denom * gl
        delta = direction + smoothing * tangent_smoothing(p)
        eta = alpha
        for attempt in range(21):
            candidate = p + eta * delta
            area, perimeter, _, _ = polygon_values(candidate)
            center = candidate.mean(axis=0)
            new = center + (candidate - center) * (target / perimeter)
            if not safe or (area > 0 and is_simple(new)):
                break
            eta *= .5
        else:
            raise RuntimeError("no valid simple step after 20 halvings")
        p = new
        accepted.append(eta)
        frames.append(p.copy())
    return (np.array(frames), np.array(accepted)) if return_steps else np.array(frames)


def is_simple(p):
    """Reject crossing or touching nonadjacent edges, including collinear ones."""
    def cross(a, b, c):
        d, e = b-a, c-a
        return d[0]*e[1]-d[1]*e[0]
    for i in range(len(p)):
        for j in range(i+1, len(p)):
            if j == i+1 or (i == 0 and j == len(p)-1):
                continue
            a, b, c, d = p[i], p[(i+1) % len(p)], p[j], p[(j+1) % len(p)]
            if np.all(np.maximum(np.minimum(a,b), np.minimum(c,d)) <= np.minimum(np.maximum(a,b), np.maximum(c,d)) + 1e-12):
                if cross(a,b,c)*cross(a,b,d) <= 1e-12 and cross(c,d,a)*cross(c,d,b) <= 1e-12:
                    return False
    return True


def refresh_lesson11(out=ROOT / "results", data_dir=ROOT / "data"):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy.optimize import minimize_scalar
    out.mkdir(exist_ok=True); data_dir.mkdir(exist_ok=True)
    rng = np.random.default_rng(20261030)
    n = 365 * 3
    t = np.arange(n) / 365.0
    X = np.column_stack([np.ones(n), t])
    noises = [gaussian_noise(n, 0, .5, rng), gaussian_noise(n, -1, .7, rng)]
    ys = [X @ [3.4, 5.7] + w for w in noises]
    np.savetxt(data_dir / "L11_2026_trends.csv", np.column_stack([t, *ys, *noises]), delimiter=",", header="t_year,y_white,y_flicker,w_white,w_flicker", comments="", fmt="%.12g")
    result = {"seed": 20261030, "n": n, "dt_year": 1/365, "truth_beta": [3.4, 5.7], "model": "finite Gaussian circulant; unit diagonal shape; f0=1/N cycles/sample; no realization normalization", "cases": {}}
    fig, axs = plt.subplots(2, 1, figsize=(9, 6), sharex=True)
    for ax, y, label in zip(axs, ys, ["white", "flicker"]):
        fits = {}
        for k, name in [(0, "white_assumed"), (-1, "flicker_assumed")]:
            beta, q, ld, info = spectral_fit(X, y, k)
            sigma = np.sqrt(q/n)
            fits[name] = {"beta": beta.tolist(), "sigma_mle": sigma, "se_conditional": np.sqrt(np.diag(sigma*sigma*np.linalg.inv(info))).tolist()}
        def objective(k):
            _, q, ld, _ = spectral_fit(X, y, k)
            return .5*(n*np.log(q/n)+ld+n)
        opt = minimize_scalar(objective, bounds=(-1.8, .5), method="bounded", options={"xatol": 1e-8})
        beta, q, _, _ = spectral_fit(X, y, opt.x)
        ks = np.linspace(-1.8, .5, 80)
        sigmas = np.linspace(.2, 1.3, 80)
        grid = np.column_stack([.5*(n*np.log(sigmas**2)+spectral_fit(X,y,k)[2]+spectral_fit(X,y,k)[1]/sigmas**2) for k in ks])
        fig2, ax2 = plt.subplots(figsize=(7, 4))
        cs = ax2.contourf(ks, sigmas, grid-objective(opt.x), levels=[0, .5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], extend="max")
        ax2.plot(opt.x, np.sqrt(q/n), "rx", label="profile minimum")
        ax2.set(xlabel="kappa (PSD exponent)", ylabel="sigma (population scale)", title=f"{label} data: same finite Gaussian likelihood")
        ax2.legend(); fig2.colorbar(cs, ax=ax2, label="negative log likelihood above minimum")
        fig2.tight_layout(); fig2.savefig(out/f"L11_2026_{label}_likelihood.png", dpi=150); plt.close(fig2)
        ax.plot(t, y, lw=.7, alpha=.7, label=f"{label} observations")
        ax.plot(t, X@[3.4,5.7], "k--", label="true trend")
        for name, style in [("white_assumed", ":"), ("flicker_assumed", "-")]:
            ax.plot(t, X@fits[name]["beta"], style, label=name)
        ax.set_ylabel("y (model unit)"); ax.legend(fontsize=8)
        result["cases"][label] = {"generating_kappa": 0 if label=="white" else -1, "generating_sigma": .5 if label=="white" else .7, "empirical_noise_std": float(np.std(y-X@[3.4,5.7])), "fits": fits, "joint_mle": {"kappa": float(opt.x), "sigma": float(np.sqrt(q/n)), "beta": beta.tolist(), "optimizer_success": bool(opt.success)}}
    axs[-1].set_xlabel("time / year (0 to 1094/365)")
    fig.tight_layout(); fig.savefig(out/"L11_2026_trends.png", dpi=150); plt.close(fig)
    (out/"L11_2026_noise_summary.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
    return result


def refresh_lesson14(out=ROOT / "results", data_dir=ROOT / "data"):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from PIL import Image
    import io
    out.mkdir(exist_ok=True); data_dir.mkdir(exist_ok=True)
    initial = polygon_initial(17)
    np.savetxt(data_dir/"L14_2026_polygon17_initial.csv", initial, delimiter=",", header="x,y", comments="", fmt="%.16g")
    area0, perimeter, _, _ = polygon_values(initial)
    bound = perimeter**2/(4*17*np.tan(np.pi/17))
    result = {"seed": 2026, "rng": "RandomState", "vertices": 17, "steps": 45, "initial_area": area0, "perimeter": perimeter, "regular_17gon_max_area": bound, "cases": []}
    fig_compare, axes = plt.subplots(2, 3, figsize=(10, 7))
    prepared = {(a,l): polygon_history(initial,a,l,return_steps=True) for a in [.1,.2] for l in [.2,.5,.9]}
    lim = 1.12 * max(np.max(abs(h-h.mean(axis=1,keepdims=True))) for h,_ in prepared.values())
    for row, alpha in enumerate([.1, .2]):
        for col, lam in enumerate([.2, .5, .9]):
            frames, accepted = prepared[alpha,lam]
            raw = polygon_history(initial, alpha, lam, safe=False)
            raw_bad = [k for k,p in enumerate(raw) if not is_simple(p)]
            metrics = [polygon_values(p)[:2] for p in frames]
            if not all(is_simple(p) and a > 0 for p, (a, _) in zip(frames, metrics)):
                raise RuntimeError("invalid polygon trajectory; do not publish animation")
            errors = [abs(l-perimeter) for _, l in metrics]
            name = f"L14_polygon_a{alpha:.1f}_lambda{lam:.1f}"
            np.savez_compressed(out/(name+".npz"), vertices=frames, area=[m[0] for m in metrics], perimeter=[m[1] for m in metrics], accepted_step=accepted)
            images=[]
            fig, ax = plt.subplots(figsize=(4.2,4.2))
            for k,p in enumerate(frames):
                ax.clear(); displayed=p-p.mean(axis=0);closed=np.vstack([displayed,displayed[0]])
                ax.plot(closed[:,0],closed[:,1],"o-",ms=3,color="#306951")
                eta = alpha if k == 0 else accepted[k-1]
                ax.set(xlim=(-lim,lim),ylim=(-lim,lim),aspect="equal",xlabel="x - vertex centroid (model unit)",ylabel="y - vertex centroid (model unit)",title=f"17 vertices | alpha={alpha}, lambda={lam}\nstep {k}/45 | A/Amax={metrics[k][0]/bound:.4f} | eta={eta:.3g}")
                fig.tight_layout(); buf=io.BytesIO();fig.savefig(buf,format="png",dpi=80);buf.seek(0);images.append(Image.open(buf).convert("RGB"))
            # Only play when opened intentionally; no infinite loop on the reading page.
            images[0].save(out/(name+".gif"),save_all=True,append_images=images[1:],duration=150,loop=1)
            plt.close(fig)
            ax=axes[row,col]
            for p,label,style in [(initial,"initial",":"),(frames[-1],"step 45","-")]:
                centered=p-p.mean(axis=0);q=np.vstack([centered,centered[0]]);ax.plot(q[:,0],q[:,1],style,label=label)
            ax.set(aspect="equal",title=f"alpha={alpha}, lambda={lam}\nA/Amax={metrics[-1][0]/bound:.4f}",xlim=(-lim,lim),ylim=(-lim,lim));ax.legend(fontsize=8)
            result["cases"].append({"alpha":alpha,"lambda":lam,"gif":name+".gif","trajectory":name+".npz","final_area":metrics[-1][0],"area_fraction":metrics[-1][0]/bound,"max_perimeter_error":max(errors),"min_area_increment":float(np.min(np.diff([m[0] for m in metrics]))),"all_frames_simple":True,"raw_self_intersection_steps":raw_bad,"backtracked_steps":(np.flatnonzero(accepted<alpha)+1).tolist(),"accepted_step_sizes":accepted.tolist()})
    fig_compare.suptitle("Coordinates recentered per frame; identical scale in all panels",fontsize=11)
    fig_compare.tight_layout();fig_compare.savefig(out/"L14_polygon_comparison.png",dpi=150);plt.close(fig_compare)
    (out/"L14_2026_polygon_summary.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    return result


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson", choices=["11","14","all"], default="all")
    args=parser.parse_args()
    if args.lesson in {"11","all"}: refresh_lesson11()
    if args.lesson in {"14","all"}: refresh_lesson14()
