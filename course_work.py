"""Run the course homework examples; outputs live in results/.

Python 3.11+; requires numpy, scipy, matplotlib, scikit-learn.
Run from anywhere: python course_work.py [--full-mc | --refresh-2026]
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import time
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy import stats
from sklearn.decomposition import FastICA
from source_models import cross_spectrum, isotropic_kde_at

ROOT = Path(__file__).resolve().parent
OUT = Path(__file__).resolve().parent / "results"
OUT.mkdir(exist_ok=True)
RNG = np.random.default_rng(20260924)
SUMMARY: dict[str, object] = {}


def save(name: str) -> None:
    plt.tight_layout()
    plt.savefig(OUT / name, dpi=160)
    plt.close()


def ols(x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray, float, np.ndarray]:
    beta, *_ = np.linalg.lstsq(x, y, rcond=None)
    resid = y - x @ beta
    df = len(y) - x.shape[1]
    s2 = float(resid @ resid / df)
    cov = s2 * np.linalg.pinv(x.T @ x)
    return beta, cov, s2, resid


def lesson02() -> None:
    x = np.array([3.163,1.883,3.252,3.716,-.049,-.653,.057,2.987,4.098,1.670,
                  1.396,2.332,1.838,3.024,2.706,.231,3.830,3.349,-.230,1.496])
    u = np.array([11.72,12.81,12.09,13.47,12.37])
    normal30 = RNG.normal(1.7,3.2,30)
    uniform30 = RNG.uniform(1.3,10.7,30)
    def uniform_mom(z: np.ndarray) -> list[float]:
        d = math.sqrt(3 * z.var())
        return [float(z.mean()-d),float(z.mean()+d)]
    samples = RNG.normal(2,2,(1000,20))
    means, variances = samples.mean(axis=1), samples.var(axis=1,ddof=1)
    fig, ax = plt.subplots(2,2,figsize=(10,7))
    ax[0,0].plot(means,lw=.6); ax[0,0].set_title("1000 sample means")
    ax[0,1].plot(variances,lw=.6); ax[0,1].set_title("1000 sample variances")
    z = np.linspace(means.min(),means.max(),300)
    ax[1,0].hist(means,bins=30,density=True,alpha=.6)
    ax[1,0].plot(z,stats.norm.pdf(z,2,math.sqrt(.2)))
    z = np.linspace(0,variances.max(),300)
    ax[1,1].hist(variances,bins=30,density=True,alpha=.6)
    ax[1,1].plot(z,stats.chi2.pdf(z*19/4,19)*19/4)
    save("L02_sampling_1000.png")
    fig,axs=plt.subplots(2,4,figsize=(12,5))
    for j,b in enumerate([5,10,20,50]):
        axs[0,j].hist(means[:b],bins=min(10,b),density=True)
        axs[0,j].set_title(f"B={b}, mean")
        axs[1,j].hist(variances[:b],bins=min(10,b),density=True)
        axs[1,j].set_title(f"B={b}, variance")
    save("L02_sampling_small_B.png")
    SUMMARY["L02"]={"normal20_mean":x.mean(),"normal20_mom_variance":x.var(),
                    "uniform5_mom_endpoints":uniform_mom(u),"normal30_data":normal30.tolist(),
                    "normal30_mean":normal30.mean(),"normal30_mom_variance":normal30.var(),
                    "uniform30_data":uniform30.tolist(),"uniform30_mom_endpoints":uniform_mom(uniform30),
                    "sampling1000_mean_of_means":means.mean(),"sampling1000_mean_of_variances":variances.mean()}


def read_iris() -> np.ndarray:
    rows=[]
    with (ROOT/"data/iris.dat").open() as f:
        next(f)
        for line in f:
            parts=line.strip().split(",")
            if len(parts)!=5: break  # original file appends another, non-iris table
            try: rows.append([float(v) for v in parts[:4]])
            except ValueError: break
    return np.asarray(rows)


def plot_iris_kde() -> None:
    iris=read_iris()
    labels=["Sepal length","Sepal width","Petal length","Petal width"]
    fig,axs=plt.subplots(2,2,figsize=(9,7))
    for row,(i,j) in enumerate([(0,1),(2,3)]):
        pair=iris[:,[i,j]].T
        xg=np.linspace(pair[0].min()-.5,pair[0].max()+.5,90)
        yg=np.linspace(pair[1].min()-.5,pair[1].max()+.5,90)
        xx,yy=np.meshgrid(xg,yg)
        pts=np.vstack([xx.ravel(),yy.ravel()])
        for col,scale in enumerate([None,1.0]):
            density = (stats.gaussian_kde(pair)(pts).reshape(xx.shape) if scale is None else
                       np.array([isotropic_kde_at(a,b,pair.T,scale) for a,b in pts.T]).reshape(xx.shape))
            ax=axs[row,col]
            contour=ax.contourf(xx,yy,density,levels=12)
            plt.colorbar(contour,ax=ax,label=r"Density / cm$^{-2}$")
            ax.set_xlabel(labels[i]+" / cm"); ax.set_ylabel(labels[j]+" / cm")
            ax.set_aspect("equal",adjustable="box")
            ax.scatter(*pair,s=2,c="white",alpha=.4)
            ax.set_title("Scott bandwidth" if scale is None else "s=1 cm; H=I cm^2")
    save("iris_2d_kde.png")


def lesson03() -> None:
    iris=read_iris()
    labels=["Sepal length","Sepal width","Petal length","Petal width"]
    with (OUT/"iris_statistics.csv").open("w",newline="") as f:
        w=csv.writer(f)
        w.writerow(["variable","n","mean","sd_ddof1","min","q01","q25","q50","q75","q99","max"])
        for j,name in enumerate(labels):
            v=iris[:,j]
            w.writerow([name,len(v),v.mean(),v.std(ddof=1),v.min(),*np.quantile(v,[.01,.25,.5,.75,.99]),v.max()])
    fig,axs=plt.subplots(2,2,figsize=(9,7))
    for j,ax in enumerate(axs.flat):
        v=iris[:,j];ax.hist(v,bins="fd",edgecolor="white")
        for q in np.quantile(v,[.25,.5,.75]):ax.axvline(q,ls="--")
        ax.set_title(labels[j])
    save("iris_histograms.png")
    plot_iris_kde()
    rain=np.loadtxt(ROOT/"data/Ithaca_precipitation1933-1982.dat",skiprows=1)[:,1]
    mu,v=float(rain.mean()),float(rain.var()); shape=mu*mu/v;scale=v/mu
    xg=np.linspace(0,max(rain)*1.1,500)
    plt.figure(figsize=(8,5))
    plt.hist(rain,bins=np.arange(0,max(rain)+.5,.5),density=True,alpha=.5,label="data")
    plt.plot(xg,stats.norm.pdf(xg,mu,math.sqrt(v)),label="Normal (moments)")
    plt.plot(xg,stats.gamma.pdf(xg,shape,scale=scale),label="Gamma (moments)")
    plt.legend();save("ithaca_density.png")
    scores={}
    transformed=[]
    for lam in [1,.5,0,-.5,-1]:
        z=np.log(rain) if lam==0 else (rain**lam-1)/lam
        iqr=np.subtract(*np.quantile(z,[.75,.25]))
        d=abs(z.mean()-np.median(z))/iqr
        L=-len(z)/2*np.log(z.var())+(lam-1)*np.log(rain).sum()
        scores[str(lam)]={"d_lambda":d,"L_lambda":L}
        transformed.append(z)
    plt.figure(figsize=(9,5));plt.boxplot(transformed,tick_labels=["1","0.5","0","-0.5","-1"])
    plt.xlabel("lambda");save("ithaca_power_boxplots.png")
    dar=np.loadtxt(ROOT/"data/darwin.slp-1000hPa.dat")
    tah=np.loadtxt(ROOT/"data/tahiti.slp-1000hpa.dat")
    assert np.array_equal(dar[:,0],tah[:,0])
    # Follow the course's Fortran snippet (25PPT L03 p58): global station
    # standardization over all monthly values, then standardize the difference.
    # 26PPT p59 / 25PPT p58. ddof=1 is declared here; the Fortran std body is absent.
    darwin=dar[:,1:].ravel();tahiti=tah[:,1:].ravel()
    dz=(darwin-darwin.mean())/darwin.std(ddof=1)
    tz=(tahiti-tahiti.mean())/tahiti.std(ddof=1)
    soi=tz-dz
    soi=soi/soi.std(ddof=1)
    dates=np.repeat(dar[:,0],12)+(np.tile(np.arange(12),len(dar))+.5)/12
    plt.figure(figsize=(11,4));plt.plot(dates,soi,lw=.6);plt.axhline(0,color="black",lw=.5)
    plt.xlabel("year");plt.ylabel("SOI (declared normalization)");save("soi_reconstructed.png")
    SUMMARY["L03"]={"iris_n":len(iris),"rain_n":len(rain),"rain_mean":mu,"rain_mom_var":v,
                    "rain_gamma_shape":shape,"rain_gamma_scale":scale,"power_scores":scores,
                    "soi_mean":soi.mean(),"soi_sd":soi.std(ddof=1)}


def lesson04() -> None:
    t=np.arange(0,1501,30.);omega=2*np.pi/365.24
    model=1.5*np.sin(omega*t-np.deg2rad(30))
    y=model+RNG.normal(0,.2,len(t))
    X=np.column_stack([np.sin(omega*t),np.cos(omega*t)])
    cd,_,_,_=ols(X,y);amp=float(np.hypot(*cd));phase=float(np.rad2deg(np.arctan2(-cd[1],cd[0])))
    plt.figure(figsize=(9,4));plt.scatter(t,y,s=10,label="observed")
    plt.plot(t,model,label="truth");plt.plot(t,X@cd,label="fitted")
    plt.legend();save("L04_sine_fit.png")
    x=np.linspace(-1,1,1024);D=np.column_stack([np.ones(len(x)),x]);truth=np.array([1.5,2.3])
    line_results={}
    plt.figure(figsize=(9,4))
    for sigma in [.2,2.0]:
        yy=D@truth+RNG.normal(0,sigma,len(x))
        beta,cov,_,_=ols(D,yy)
        line_results[str(sigma)]={"beta":beta.tolist(),"se":np.sqrt(np.diag(cov)).tolist()}
        plt.scatter(x[::16],yy[::16],s=5,alpha=.5,label=f"noise sd {sigma}")
        if sigma==2.0:
            contaminated=yy.copy();contaminated[-1]+=80;contaminated[-2]+=70
            bad,_,_,_=ols(D,contaminated)
            line_results["2.0_with_outliers"]={"beta":bad.tolist()}
            # Show the actually contaminated observations and fit, not only the clean cloud.
            plt.scatter(x[-2:],contaminated[-2:],s=35,marker="x",c="brown",label="added errors +70,+80")
            plt.plot(x,D@bad,c="brown",ls="--",label="OLS after added errors")
    plt.plot(x,D@truth,c="black",label="truth")
    plt.xlabel("x (constructed units)");plt.ylabel("response (constructed units)")
    plt.legend(loc="upper left")
    zoom=plt.gca().inset_axes([.12,.42,.58,.35])
    zoom.scatter(x[::16],yy[::16],s=4,alpha=.4)
    zoom.plot(x,D@truth,c="black");zoom.plot(x,D@bad,c="brown",ls="--")
    zoom.set_ylim(-5,10);zoom.set_title("Main cloud and fit: enlarged y scale",fontsize=9)
    save("L04_noise_outliers.png")
    raw=np.loadtxt(ROOT/"data/bjfs.rm.leap.dat",skiprows=1,usecols=(0,4),encoding="latin1")
    raw=raw[np.isfinite(raw).all(axis=1)]
    tt,obs=raw[:,0],raw[:,1];t0=float(tt.mean());tau=tt-t0
    G=np.column_stack([np.ones(len(tt)),tau,tau**2,np.cos(2*np.pi*tau),np.sin(2*np.pi*tau)])
    b,cov,s2,res=ols(G,obs)
    A=float(np.hypot(b[3],b[4]));phi=float(np.arctan2(b[4],b[3]))
    grad_A=np.array([b[3],b[4]])/A
    grad_phi=np.array([-b[4],b[3]])/(A*A)
    harm_cov=cov[3:5,3:5]
    plt.figure(figsize=(11,4));plt.scatter(tt,obs,s=2,label="data")
    plt.plot(tt,G@b,c="red",lw=1,label="annual + quadratic")
    plt.legend();save("L04_bjfs_fit.png")
    bayes={}
    for n in [3,7,200]:
        xb=RNG.uniform(1,5,n);B=np.column_stack([np.ones(n),xb])
        yb=B@np.array([.6,1.3])+RNG.normal(0,.1,n)
        post_cov=np.linalg.inv(4*np.eye(2)+B.T@B/.01)
        post_mean=post_cov@(B.T@yb/.01)
        ls,ls_cov,_,_=ols(B,yb)
        bayes[str(n)]={"posterior_mean":post_mean.tolist(),"posterior_sd":np.sqrt(np.diag(post_cov)).tolist(),
                      "ols_mean":ls.tolist(),"ols_se_estimated_noise":np.sqrt(np.diag(ls_cov)).tolist()}
    SUMMARY["L04"]={"sine_amplitude":amp,"sine_phase_deg":phase,"line_simulation":line_results,
                    "bjfs_t0":t0,"bjfs_beta_centered":b.tolist(),"bjfs_beta_se":np.sqrt(np.diag(cov)).tolist(),
                    "bjfs_annual_amplitude":A,"bjfs_amplitude_se":math.sqrt(grad_A@harm_cov@grad_A),
                    "bjfs_annual_phase_deg":math.degrees(phi),
                    "bjfs_phase_se_deg":math.degrees(math.sqrt(grad_phi@harm_cov@grad_phi)),"bayes":bayes}


def lesson05() -> None:
    x=np.linspace(-2,2,300);ytrue=1.5+2.3*x+.7*x*x
    y=ytrue+RNG.normal(0,2.4,len(x))
    X1=np.column_stack([np.ones(len(x)),x]);X2=np.column_stack([X1,x*x])
    fig,axs=plt.subplots(1,2,figsize=(11,4))
    axs[0].plot(x,ytrue,label="truth");axs[0].scatter(x,y,s=3,label="observed");axs[0].legend()
    results={}
    for name,X in [("linear",X1),("quadratic",X2)]:
        b,cov,s2,res=ols(X,y)
        tcrit=stats.t.ppf(.975,len(y)-X.shape[1]);ci=np.column_stack([b-tcrit*np.sqrt(np.diag(cov)),b+tcrit*np.sqrt(np.diag(cov))])
        r2=1-(res@res)/np.sum((y-y.mean())**2)
        results[name]={"beta":b.tolist(),"ci95":ci.tolist(),"r2":r2,"rss":float(res@res)}
        axs[1].plot(x,X@b,label=name)
        if name=="quadratic":
            pred_var=np.einsum("ij,jk,ik->i",X,np.linalg.pinv(X.T@X),X)*s2
            axs[1].fill_between(x,X@b-tcrit*np.sqrt(pred_var),X@b+tcrit*np.sqrt(pred_var),alpha=.25,label="mean CI")
            axs[1].fill_between(x,X@b-tcrit*np.sqrt(s2+pred_var),X@b+tcrit*np.sqrt(s2+pred_var),alpha=.15,label="prediction interval")
    axs[1].scatter(x,y,s=2,alpha=.4);axs[1].legend()
    save("L05_regression_intervals.png")
    SUMMARY["L05"]=results


def lesson06(full_mc: bool) -> None:
    reps=200 if full_mc else 10
    ns=np.arange(2,501)
    with (OUT/"L06_correlation_critical.csv").open("w",newline="") as f:
        writer=csv.writer(f)
        writer.writerow(["n","level","exact_two_sided_abs_r","mc_mean","mc_sd","outer_repeats"])
        for n in ns:
            df=n-2
            for level in [.90,.95,.99]:
                tcrit=stats.t.ppf((1+level)/2,df) if n>2 else np.inf
                exact=tcrit/math.sqrt(tcrit*tcrit+df) if n>2 else 1.
                # Under the null, r has the t transform. Sampling t directly is
                # equivalent to sampling two normal series, much faster here.
                sim=np.ones((reps,2000)) if n==2 else stats.t.rvs(df,size=(reps,2000),random_state=RNG)
                if n>2: sim=np.abs(sim)/np.sqrt(sim*sim+df)
                q=np.quantile(sim,level,axis=1)
                writer.writerow([n,level,exact,q.mean(),q.std(ddof=1),reps])
    T=1825;N=1825;fs=1.;fn=.5;df=1/N
    tt=np.linspace(-2*np.pi,2*np.pi,1200)
    wave=np.where(np.sin(tt)>=0,1.,-1.)
    plt.figure(figsize=(10,4));plt.plot(tt,wave,c="black",lw=1,label="square wave")
    for m in [1,3,5]:
        approx=sum((4/np.pi/k)*np.sin(k*tt) for k in range(1,m+1,2))
        plt.plot(tt,approx,label=f"up to harmonic {m}")
    plt.legend();save("L06_square_wave.png")
    SUMMARY["L06"]={"correlation_outer_repeats":reps,"N":1825,"fs":fs,"nyquist":fn,"df":df}
    lesson06_spectra()


def lesson06_spectra() -> None:
    """Current 2026 lesson 6 questions 4 and 5."""
    rng=np.random.default_rng(20260930)
    t=np.arange(0,1501,30.)
    clean=1.4+3*np.cos(2*np.pi*t/365.24-30*np.pi/180)
    signal=clean+rng.normal(0,1,len(t))
    N=len(t);freq=np.fft.rfftfreq(N,d=30)
    fig,axs=plt.subplots(3,1,figsize=(9,9),sharex=True)
    for label,data in (("noise-free",clean),("with noise",signal)):
        ft=np.fft.rfft(data)
        amp=2*np.abs(ft)/N
        amp[0]/=2
        energy=np.abs(ft)**2/N**2
        axs[0].plot(freq,energy,label=label)
        axs[1].plot(freq,amp,label=label)
        axs[2].plot(freq,np.angle(ft),label=label,marker=".",ms=2)
    for ax in axs: ax.legend();ax.grid(alpha=.2)
    axs[0].set_ylabel("two-sided bin power")
    axs[1].set_ylabel("one-sided amplitude")
    axs[2].set_ylabel("phase (radian)")
    axs[2].set_xlabel("cycles/day")
    save("L06_fft_spectra.png")
    windows={"rectangular":np.ones(N),"Hann":np.hanning(N),"triangular":np.bartlett(N),
             "cosine":np.sin(np.pi*(np.arange(N)+.5)/N)}
    fig,axs=plt.subplots(2,1,figsize=(9,7))
    for name,w in windows.items():
        ft=np.fft.rfft((signal-signal.mean())*w)
        amp=2*np.abs(ft)/(N*w.mean());amp[0]/=2
        axs[0].plot(freq,amp,label=name)
        axs[1].plot(freq,np.angle(ft),label=name,marker=".",ms=2)
    axs[0].set_ylabel("one-sided amplitude");axs[1].set_ylabel("phase (radian)")
    axs[1].set_xlabel("cycles/day");axs[0].legend()
    save("L06_fft_windows.png")
    width=10.;height=3.;dt=.01
    box_t=np.arange(-50.,50.,dt)
    box=np.where(np.abs(box_t)<width/2,height,0.)
    box_freq=np.fft.fftshift(np.fft.fftfreq(len(box_t),d=dt))
    box_fft=dt*np.fft.fftshift(np.fft.fft(np.fft.ifftshift(box)))
    f=np.linspace(-.5,.5,2001)
    analytic=height*width*np.sinc(width*f)
    fig,axs=plt.subplots(2,1,figsize=(9,7),sharex=True)
    axs[0].plot(f,analytic,label="analytic F(f)")
    keep=np.abs(box_freq)<=.5
    axs[0].plot(box_freq[keep],box_fft.real[keep],".",ms=3,label="sampled FFT")
    axs[1].plot(f,np.abs(analytic),label="|F(f)|")
    for ax in axs:
        for zero in [-2/width,-1/width,1/width,2/width]:
            ax.axvline(zero,color="gray",ls="--",lw=.8)
        ax.grid(alpha=.2);ax.legend()
    axs[0].set_ylabel("Fourier transform")
    axs[1].set_ylabel("magnitude")
    axs[1].set_xlabel("cycles per unit t")
    save("L06_box_fourier.png")
    SUMMARY.setdefault("L06",{}).update({
        "fft_phase_radians":float(np.pi/6),
        "fft_n":N,
        "fft_max_reconstruction_error":float(np.max(np.abs(np.fft.ifft(np.fft.fft(signal)).real-signal))),
        "fft_max_clean_reconstruction_error":float(np.max(np.abs(np.fft.ifft(np.fft.fft(clean)).real-clean))),
        "box_width":width,
        "box_amplitude":height,
        "box_transform_at_zero":height*width,
        "box_first_two_positive_zeros":[1/width,2/width],
        "box_fft_max_real_error_f_le_0_5":float(np.max(np.abs(np.interp(box_freq[keep],f,analytic)-box_fft.real[keep])))
    })


def lesson07() -> None:
    t=np.arange(0,1501,30.)
    x=.4+1.5*np.cos(2*np.pi*t/365.24-np.pi/3)+RNG.normal(0,1,len(t))
    h=np.ones(5)/5
    def direct(a: np.ndarray) -> tuple[np.ndarray,float]:
        t0=time.perf_counter();v=np.convolve(a,h,mode="full");return v,time.perf_counter()-t0
    def fftconv(a: np.ndarray) -> tuple[np.ndarray,float]:
        t0=time.perf_counter();n=len(a)+len(h)-1
        v=np.fft.irfft(np.fft.rfft(a,n)*np.fft.rfft(h,n),n)
        return v,time.perf_counter()-t0
    d,td=direct(x);f,tf=fftconv(x)
    long=RNG.normal(size=30001);_,tdl=direct(long);_,tfl=fftconv(long)
    plt.figure(figsize=(9,4));plt.plot(x,label="input");plt.plot(d[:len(x)],label="moving average")
    plt.legend();save("L07_convolution.png")
    a=RNG.normal(size=500);b=RNG.normal(size=500)
    A=np.fft.rfft(a);B=np.fft.rfft(b)
    # One raw periodogram has coherence identically one; average cross and auto
    # spectra first. This is a declared 3-bin frequency smoother, not Welch.
    from scipy.ndimage import uniform_filter1d
    fig,axs=plt.subplots(2,1,figsize=(9,6))
    thresholds={}
    for M in [3,5,7,9,11]:
        saa=uniform_filter1d(np.abs(A)**2,size=M,mode="nearest")
        sbb=uniform_filter1d(np.abs(B)**2,size=M,mode="nearest")
        sab=uniform_filter1d(cross_spectrum(A,B),size=M,mode="nearest")
        coh=np.abs(sab)**2/(saa*sbb)
        thresholds[str(M)]=1-.05**(1/(M-1))
        if M==3:
            axs[0].plot(np.fft.rfftfreq(500),coh)
            axs[0].axhline(thresholds[str(M)],ls="--",c="red")
            axs[1].plot(np.fft.rfftfreq(500),np.angle(sab))
    axs[0].set_ylabel("coherence, M=3");axs[1].set_ylabel("phase")
    save("L07_coherence.png")
    empirical={str(m):[] for m in [3,5,7,9,11]}
    for _ in range(2000):
        aa=RNG.normal(size=500);bb=RNG.normal(size=500)
        fa=np.fft.rfft(aa);fb=np.fft.rfft(bb)
        for m in [3,5,7,9,11]:
            pa=uniform_filter1d(np.abs(fa)**2,size=m,mode="nearest")
            pb=uniform_filter1d(np.abs(fb)**2,size=m,mode="nearest")
            cross=uniform_filter1d(cross_spectrum(fa,fb),size=m,mode="nearest")
            co=np.abs(cross)**2/(pa*pb)
            empirical[str(m)].extend(co[m:-m:10].tolist())
    empirical={m:float(np.quantile(v,.95)) for m,v in empirical.items()}
    # Generate colored noise by controlled frequency-domain shaping.
    n=4096;white=RNG.normal(size=n)
    freqs=np.fft.rfftfreq(n)
    def colored(kappa: float) -> np.ndarray:
        p=np.maximum(freqs,1/n)**kappa
        z=np.fft.irfft(np.fft.rfft(RNG.normal(size=n))*np.sqrt(p),n)
        return (z-z.mean())/z.std()
    walk=np.cumsum(RNG.normal(size=n));walk=(walk-walk.mean())/walk.std()
    fogm=np.zeros(n)
    for i in range(1,n):fogm[i]=.97*fogm[i-1]+RNG.normal()
    fogm=(fogm-fogm.mean())/fogm.std()
    # Qualitative low-frequency-cutoff approximation, NOT the exact course GGM recurrence.
    ggm_p=1/np.maximum(freqs,1/256)
    ggm=np.fft.irfft(np.fft.rfft(RNG.normal(size=n))*np.sqrt(ggm_p),n)
    ggm=(ggm-ggm.mean())/ggm.std()
    series={"white":white,"flicker":colored(-1),"random walk":walk,"FOGM":fogm,"cutoff 1/f approximation":ggm}
    fig,axs=plt.subplots(2,1,figsize=(10,7))
    for name,z in series.items():
        axs[0].plot(z[:300],label=name,alpha=.65)
        from scipy.signal import welch
        ff,ps=welch(z,nperseg=512)
        axs[1].loglog(ff[1:],ps[1:],label=name)
    axs[0].legend(ncol=3);axs[1].legend(ncol=3)
    axs[1].set_xlabel("frequency");axs[1].set_ylabel("PSD")
    save("L07_noise_types.png")
    SUMMARY["L07"]={"short_direct_s":td,"short_fft_s":tf,"long_direct_s":tdl,"long_fft_s":tfl,
                    "max_convolution_difference":float(np.max(np.abs(d-f))),"coherence_theory_thresholds":thresholds,
                    "coherence_empirical_95":empirical,
                    "propagation_variance":1.2/9+4*.5+25*.9}
    lesson07_dust()


def lesson07_dust() -> None:
    """Current 2026 lesson 7 question 5, with an explicit radius assumption."""
    mass_per_year=5e7
    density=2.5e3
    radius=6.371e6
    volume_per_year=mass_per_year/density
    initial_volume=4*math.pi*radius**3/3
    def exact_growth(years: float) -> float:
        ratio=years*volume_per_year/initial_volume
        return radius*math.expm1(math.log1p(ratio)/3)
    years=4.6e9
    linear_per_year=volume_per_year/(4*math.pi*radius**2)
    SUMMARY.setdefault("L07",{}).update({
        "dust_assumed_initial_radius_m":radius,
        "dust_mass_kg_per_year":mass_per_year,
        "dust_density_kg_per_m3":density,
        "dust_volume_m3_per_year":volume_per_year,
        "dust_exact_growth_m_per_year":exact_growth(1),
        "dust_linear_growth_m_per_year":linear_per_year,
        "dust_exact_growth_m_over_4_6_billion_years":exact_growth(years),
        "dust_linear_growth_m_over_4_6_billion_years":linear_per_year*years
    })


def lesson08() -> None:
    A=np.array([[8,5],[7,3],[4,6]],dtype=float)
    U,s,Vt=np.linalg.svd(A,full_matrices=False)
    Ap=(Vt.T/s)@U.T
    checks={"double_pinv":np.linalg.norm(np.linalg.pinv(Ap)-A),
            "AA+A":np.linalg.norm(A@Ap@A-A),"A+AA+":np.linalg.norm(Ap@A@Ap-Ap),
            "transpose":np.linalg.norm(np.linalg.pinv(A.T)-Ap.T),
            "A+A_sym":np.linalg.norm(Ap@A-(Ap@A).T),
            "AA+_sym":np.linalg.norm(A@Ap-(A@Ap).T)}
    C=A.T@A;D=A@A.T
    rng=np.random.default_rng(20260924)
    X=rng.normal(size=(300,2))
    angle=2*np.pi/3;R=np.array([[np.cos(angle),-np.sin(angle)],[np.sin(angle),np.cos(angle)]])
    S=np.diag([5.265,1.13]);Y=X@R.T@S.T
    cov=np.cov(Y,rowvar=False);val,vec=np.linalg.eigh(cov)
    theta=np.linspace(0,2*np.pi,400)
    plt.figure(figsize=(7,6));plt.scatter(Y[:,0],Y[:,1],s=5,alpha=.35)
    for level in [4,5.991]:
        ellipse=(vec@(np.sqrt(level*val)[:,None]*np.vstack([np.cos(theta),np.sin(theta)]))).T+Y.mean(axis=0)
        plt.plot(ellipse[:,0],ellipse[:,1],label=f"s={level}")
    plt.axis("equal");plt.legend();save("L08_error_ellipse.png")
    SUMMARY["L08"]={"singular_values":s.tolist(),"eig_AtA":np.linalg.eigvalsh(C).tolist(),
                    "eig_AAt":np.linalg.eigvalsh(D).tolist(),"pinv_checks":checks,
                    "ellipse_sample_cov":cov.tolist(),"ellipse_theoretical_cov":(S@S).tolist()}


def lesson11() -> None:
    # SST: ignore land and incomplete pixels, then center each spatial location.
    data=np.loadtxt(ROOT/"data/pacific_sst_test_data.txt",skiprows=1)
    loc,li=np.unique(data[:,:2],axis=0,return_inverse=True)
    times,ti=np.unique(data[:,2],return_inverse=True)
    mat=np.full((len(loc),len(times)),np.nan);mat[li,ti]=data[:,3]
    mat[mat<-1e9]=np.nan
    good=np.isfinite(mat).all(axis=1);M=mat[good]
    M=M-M.mean(axis=1,keepdims=True)
    U,s,Vt=np.linalg.svd(M,full_matrices=False)
    frac=s*s/np.sum(s*s)
    pc=(s[:3,None]*Vt[:3]).T
    ica=FastICA(n_components=3,whiten="unit-variance",random_state=20260924,max_iter=2000,tol=.001)
    # Fit ICA across the many spatial pixels, using the leading EOF scores.
    independent=ica.fit_transform(U[:,:3]*s[:3])
    fig,axs=plt.subplots(2,2,figsize=(10,7))
    axs[0,0].scatter(loc[good,0],loc[good,1],c=U[:,0],s=2,cmap="coolwarm")
    axs[0,0].set_title("EOF1 spatial loading")
    axs[0,1].plot(times,pc[:,0]);axs[0,1].set_title("PC1")
    for j in range(2):
        axs[1,j].scatter(loc[good,0],loc[good,1],c=independent[:,j],s=2,cmap="coolwarm")
        axs[1,j].set_title(f"ICA spatial source {j+1}")
    save("L11_sst_eof_ica.png")
    from homework_2026 import refresh_lesson11
    noise = refresh_lesson11()
    SUMMARY["L11"] = {"sst_locations": len(loc), "sst_ocean_complete": len(M),
                      "sst_times": len(times), "sst_explained_first3": frac[:3].tolist(),
                      "noise_2026": noise}


def lesson12() -> None:
    truth=np.array([50.005,49.994,49.993,50.001,50.006,49.998,50.021,50.005,50,49.997])
    z=np.array([49.986,49.963,50.09,50.001,50.018,50.050,49.938,49.858,49.965,50.114])
    est=[];gains=[];state=60.;P=100.;Q=1e-10;R=.01
    for obs in z:
        P+=Q;K=P/(P+R);state+=K*(obs-state);P=(1-K)*P
        est.append(state);gains.append(K)
    fig,axs=plt.subplots(2,1,figsize=(8,6))
    k=np.arange(1,11)
    axs[0].plot(k,truth,"o-",label="truth");axs[0].plot(k,z,"x--",label="observed")
    axs[0].plot(k,est,"s-",label="estimate");axs[0].legend()
    axs[1].plot(k,gains,"o-");axs[1].set_ylabel("Kalman gain");axs[1].set_xlabel("time index")
    save("L12_kalman_temperature.png")
    SUMMARY["L12"]={"estimates":est,"gains":gains}


def lesson13() -> None:
    start=np.array([-7.,2.]);methods={}
    for name in ["SGD","Momentum","AdaGrad","Adam"]:
        p=start.copy();v=np.zeros(2);acc=np.zeros(2);m=np.zeros(2);q=np.zeros(2);path=[p.copy()]
        for step in range(1,81):
            g=np.array([2*p[0]/15,2*p[1]/5])
            if name=="SGD":p-=.3*g
            elif name=="Momentum":v=.9*v-.1*g;p+=v
            elif name=="AdaGrad":acc+=g*g;p-=.7*g/(np.sqrt(acc)+1e-8)
            else:
                m=.9*m+.1*g;q=.999*q+.001*g*g
                p-=.12*(m/(1-.9**step))/(np.sqrt(q/(1-.999**step))+1e-8)
            path.append(p.copy())
        methods[name]=np.array(path)
    xx=np.linspace(-8,8,200);yy=np.linspace(-5,5,200);X,Y=np.meshgrid(xx,yy)
    plt.figure(figsize=(8,5));plt.contour(X,Y,X*X/15+Y*Y/5,levels=20)
    for name,path in methods.items():plt.plot(path[:,0],path[:,1],".-",ms=2,label=name)
    plt.legend();save("L13_optimizers.png")
    SUMMARY["L13"]={name:{"final_xy":path[-1].tolist(),"final_loss":float(path[-1,0]**2/15+path[-1,1]**2/5)} for name,path in methods.items()}


def gradient_regression(X: np.ndarray,y: np.ndarray,theta: np.ndarray,iters: int,epsilon: float,
                        rmmean: int=0,normal: int=0,learning_rate: float=.1,
                        precision95: int=0,mc_reps: int=500,seed: int=20260924):
    """Optional L14 reference. X excludes intercept; output in original units.

    pre95 is an array of [lower, upper] parametric Monte Carlo limits or None.
    """
    rng=np.random.default_rng(seed)
    X=np.asarray(X,dtype=float);y=np.asarray(y,dtype=float)
    if X.ndim==1:X=X[:,None]
    if y.ndim!=1 or len(X)!=len(y):raise ValueError("shape mismatch")
    n,p=X.shape
    xmean=X.mean(axis=0) if rmmean else np.zeros(p)
    ymean=float(y.mean()) if rmmean else 0.
    scale=X.std(axis=0) if normal else np.ones(p)
    if np.any(scale==0):raise ValueError("constant predictor cannot be normalized")
    Z=(X-xmean)/scale
    D=np.column_stack([np.ones(n),Z])
    def fit(target: np.ndarray) -> np.ndarray:
        beta=np.asarray(theta,dtype=float).copy()
        if len(beta)!=p+1:raise ValueError("theta must include intercept")
        for _ in range(iters):
            new=beta-learning_rate*(D.T@(D@beta-target))/n
            if np.max(np.abs(new-beta))<=epsilon:beta=new;break
            beta=new
        slopes=beta[1:]/scale
        intercept=beta[0]+ymean-xmean@slopes
        return np.r_[intercept,slopes]
    coef=fit(y-ymean)
    ci=None
    if precision95:
        resid=y-(coef[0]+X@coef[1:])
        noise_sd=resid.std(ddof=p+1)
        draws=np.array([fit(coef[0]+X@coef[1:]+rng.normal(0,noise_sd,n)-ymean) for _ in range(mc_reps)])
        ci=np.quantile(draws,[.025,.975],axis=0).T
    return coef,ci


def pca_function(X: np.ndarray,ncomponents: int,n_restore: int|None=None):
    """Optional L14 interface: observations in rows, features in columns."""
    X=np.asarray(X,dtype=float)
    if n_restore is None:n_restore=ncomponents
    if X.ndim!=2 or not 1<=n_restore<=ncomponents<=min(X.shape):raise ValueError("invalid dimensions")
    mean=X.mean(axis=0);centered=X-mean
    _,s,Vt=np.linalg.svd(centered,full_matrices=False)
    eig=s*s/(len(X)-1);vec=Vt[:ncomponents].T
    pcs=centered@vec
    restored=pcs[:,:n_restore]@vec[:,:n_restore].T+mean
    return eig[:ncomponents],vec,pcs,eig[:ncomponents]/eig.sum(),restored


def lesson14() -> None:
    from homework_2026 import refresh_lesson14
    x=np.linspace(-1,1,80)[:,None];y=1.2+2.4*x[:,0]+RNG.normal(0,.2,len(x))
    coef,ci=gradient_regression(x,y,np.zeros(2),10000,1e-9,rmmean=1,normal=1,
                                learning_rate=.3,precision95=1,mc_reps=200)
    eig,vec,pc,frac,restored=pca_function(read_iris(),2,1)
    SUMMARY["L14"]={"gradient_regression_coefficients":coef.tolist(),
                    "gradient_regression_ci95":ci.tolist(),"pca_eigenvalues_first2":eig.tolist(),
                    "pca_explained_first2":frac.tolist(),"pca_rank1_mse":float(np.mean((read_iris()-restored)**2)),
                    "polygon_2026":refresh_lesson14()}


def refresh_source_figures() -> None:
    """Only repair the audited figures; retain archived simulation tables and summary."""
    import tempfile
    import shutil
    global OUT, RNG
    original_out, original_rng = OUT, RNG
    with tempfile.TemporaryDirectory() as directory:
        OUT = Path(directory)
        # Replay the original RNG order through lesson04, preserving its numeric example.
        RNG = np.random.default_rng(20260924)
        original_summary = SUMMARY.copy()
        lesson02(); lesson03(); lesson04()
        for name in ["iris_2d_kde.png", "L04_noise_outliers.png"]:
            shutil.copyfile(OUT/name, original_out/name)
        SUMMARY.clear(); SUMMARY.update(original_summary)
    OUT, RNG = original_out, original_rng
    # This display uses an explicit independent seed, not the historical MC stream.
    rng = np.random.default_rng(20261015)
    a,b = rng.normal(size=(2,500))
    A,B = np.fft.rfft(a),np.fft.rfft(b)
    from scipy.ndimage import uniform_filter1d
    saa=uniform_filter1d(abs(A)**2,size=3,mode="nearest")
    sbb=uniform_filter1d(abs(B)**2,size=3,mode="nearest")
    sab=uniform_filter1d(cross_spectrum(A,B),size=3,mode="nearest")
    fig,axs=plt.subplots(2,1,figsize=(9,6))
    f=np.fft.rfftfreq(500)
    axs[0].plot(f,abs(sab)**2/(saa*sbb))
    axs[0].axhline(1-.05**.5,ls="--",c="red",label="course reference threshold")
    axs[0].legend();axs[0].set_ylabel("magnitude-squared coherence")
    axs[1].plot(f,np.angle(sab));axs[1].set_ylabel("arg(conj(X)Y) / rad")
    axs[1].set_xlabel("frequency / cycles per sample")
    axs[0].set_title("Independent Gaussian series, n=500, seed=20261015; 3-bin smoothing")
    save("L07_coherence.png")


def json_default(x):
    if isinstance(x,(np.integer,)):return int(x)
    if isinstance(x,(np.floating,)):return float(x)
    raise TypeError(type(x))


def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--full-mc",action="store_true",help="200 outer Monte Carlo repeats for every n=2..500")
    parser.add_argument("--refresh-2026",action="store_true",help="refresh only 2026 lesson 6-7 additions, preserving existing results")
    parser.add_argument("--refresh-2026-late",action="store_true",help="only refresh completed 2026 L11 noise and new L14 polygon task")
    parser.add_argument("--refresh-source-figures",action="store_true",help="repair audited KDE, outlier and cross-spectrum figures only")
    args=parser.parse_args()
    if args.refresh_2026_late:
        from homework_2026 import refresh_lesson11, refresh_lesson14
        path = OUT/"summary.json"
        if path.exists():
            SUMMARY.update(json.loads(path.read_text()))
        old = SUMMARY.setdefault("L11", {})
        archived = {k: old.pop(k) for k in list(old) if k.startswith("noise_") and k not in {"noise_2025_reference", "noise_2026"}}
        if archived:
            old["noise_2025_reference"] = archived
        old["noise_2026"] = refresh_lesson11()
        SUMMARY.setdefault("L14", {})["polygon_2026"] = refresh_lesson14()
        path.write_text(json.dumps(SUMMARY, ensure_ascii=False, indent=2, default=json_default)+"\n")
        return
    if args.refresh_source_figures:
        refresh_source_figures()
        return
    if args.refresh_2026:
        path=OUT/"summary.json"
        if path.exists():
            SUMMARY.update(json.loads(path.read_text()))
        lesson06_spectra()
        lesson07_dust()
    else:
        lesson02();lesson03();lesson04();lesson05();lesson06(args.full_mc)
        lesson07();lesson08();lesson11();lesson12();lesson13();lesson14()
    (OUT/"summary.json").write_text(json.dumps(SUMMARY,ensure_ascii=False,indent=2,default=json_default)+"\n")
    print("Wrote",OUT)


if __name__=="__main__":main()
