"""Independent checks for the changed 2026 assignment models (requires numpy)."""
import json
from pathlib import Path
import unittest
import numpy as np
from homework_2026 import (
    spectral_shape, spectral_fit, gaussian_noise, polygon_values,
    polygon_initial, polygon_history, tangent_smoothing, is_simple,
)

ROOT = Path(__file__).resolve().parents[1]


class SpectralTests(unittest.TestCase):
    def test_delivered_two_dataset_results(self):
        data = np.loadtxt(ROOT/'data/L11_2026_trends.csv',delimiter=',',skiprows=1)
        summary = json.loads((ROOT/'results/L11_2026_noise_summary.json').read_text())
        self.assertEqual(data.shape,(1095,5))
        np.testing.assert_allclose(data[:,0],np.arange(1095)/365,atol=1e-11)
        X=np.column_stack([np.ones(len(data)),data[:,0]])
        for j,key in enumerate(['white','flicker']):
            np.testing.assert_allclose(data[:,j+1]-data[:,j+3],X@[3.4,5.7],atol=1e-10)
            for k,name in [(0,'white_assumed'),(-1,'flicker_assumed')]:
                fit,q,_,_=spectral_fit(X,data[:,j+1],k)
                np.testing.assert_allclose(fit,summary['cases'][key]['fits'][name]['beta'],atol=1e-10)
                self.assertAlmostEqual(np.sqrt(q/1095),summary['cases'][key]['fits'][name]['sigma_mle'],places=10)

    def test_exact_gls_matches_dense_covariance_odd_and_even(self):
        for n in [11, 12]:
            for kappa in [0, -1, .5]:
                s, mult = spectral_shape(n, kappa)
                row = np.fft.irfft(s, n)
                C = row[(np.arange(n)[:, None]-np.arange(n)) % n]
                np.testing.assert_allclose(np.diag(C), 1)
                self.assertGreater(np.linalg.eigvalsh(C).min(), 0)
                self.assertEqual(mult.sum(), n)
                X = np.column_stack([np.ones(n), np.arange(n)/365])
                y = np.random.default_rng(34).normal(size=n)
                beta, q, ld, info = spectral_fit(X, y, kappa)
                W = np.linalg.inv(C)
                dense_info = X.T@W@X
                expected = np.linalg.solve(dense_info, X.T@W@y)
                np.testing.assert_allclose(beta, expected, rtol=1e-10, atol=1e-10)
                np.testing.assert_allclose(info, dense_info, rtol=1e-12, atol=1e-12)
                self.assertAlmostEqual(q, (y-X@expected)@W@(y-X@expected), places=10)
                self.assertAlmostEqual(ld, np.linalg.slogdet(C)[1], places=10)

    def test_year_units_and_gaussian_scale(self):
        rng = np.random.default_rng(12)
        y = gaussian_noise(20, 0, .5, rng)
        np.testing.assert_allclose(y, .5*np.random.default_rng(12).normal(size=20), atol=1e-14)
        self.assertFalse(np.isclose(y.std(), .5))  # no artificial exact sample SD
        X = np.column_stack([np.ones(20), np.arange(20)/365])
        fit, *_ = spectral_fit(X, X@[3.4,5.7], 0)
        np.testing.assert_allclose(fit, [3.4,5.7], atol=1e-11)

    def test_invalid_models(self):
        for n, k in [(3,-1),(4.2,-1),(10,np.inf)]:
            with self.assertRaises(ValueError): spectral_shape(n,k)
        with self.assertRaises(ValueError): gaussian_noise(10,-1,0,np.random.default_rng())
        for X,y in [(np.ones((10,2)),np.zeros(10)),(np.ones((10,1)),np.zeros(9)),(np.ones((10,1)),np.full(10,np.nan))]:
            with self.assertRaises(ValueError): spectral_fit(X,y,-1)


class PolygonTests(unittest.TestCase):
    def test_gradients_against_central_difference(self):
        p = polygon_initial(7)
        area, perim, ga, gl = polygon_values(p)
        h = 1e-6
        for i in range(len(p)):
            for j in range(2):
                plus, minus = p.copy(), p.copy()
                plus[i,j] += h; minus[i,j] -= h
                ap,lp,*_ = polygon_values(plus);am,lm,*_ = polygon_values(minus)
                self.assertAlmostEqual((ap-am)/(2*h),ga[i,j],places=7)
                self.assertAlmostEqual((lp-lm)/(2*h),gl[i,j],places=7)
        direction = ga-np.sum(ga*gl)/np.sum(gl*gl)*gl
        self.assertAlmostEqual(float(np.sum(direction*gl)),0,places=12)
        # Discrete tangent smoothing need NOT conserve polygon perimeter to first order.
        self.assertGreater(abs(float(np.sum(tangent_smoothing(p)*gl))), 1e-4)
        reverse = polygon_values(p[::-1])
        self.assertAlmostEqual(reverse[0],-area)
        self.assertAlmostEqual(reverse[1],perim)

    def test_all_six_trajectories_and_regular_bound(self):
        p = polygon_initial(17)
        target = polygon_values(p)[1]
        bound = target**2/(4*17*np.tan(np.pi/17))
        for alpha in [.1,.2]:
            for lam in [.2,.5,.9]:
                history, sizes = polygon_history(p,alpha,lam,return_steps=True)
                self.assertEqual(history.shape,(46,17,2))
                self.assertTrue(np.all((sizes>0)&(sizes<=alpha)))
                for frame in history:
                    area, perimeter, *_ = polygon_values(frame)
                    self.assertTrue(is_simple(frame))
                    self.assertGreater(area,0)
                    self.assertLessEqual(area,bound+1e-10)
                    self.assertAlmostEqual(perimeter,target,places=11)
                np.testing.assert_allclose(history,polygon_history(p,alpha,lam),atol=0)
        raw = polygon_history(p,.2,.2,safe=False)
        self.assertFalse(is_simple(raw[10]))  # the actual source-algorithm counterexample
        safe,sizes = polygon_history(p,.2,.2,return_steps=True)
        self.assertTrue(np.any(sizes<.2))

    def test_regular_polygon_stationarity(self):
        for n in [3,4,17]:
            angle=np.arange(n)*2*np.pi/n
            p=np.column_stack([np.cos(angle),np.sin(angle)])
            area, perim, ga, gl=polygon_values(p)
            self.assertAlmostEqual(area,perim**2/(4*n*np.tan(np.pi/n)),places=12)
            d=ga-np.sum(ga*gl)/np.sum(gl*gl)*gl
            np.testing.assert_allclose(d,0,atol=1e-14)

    def test_degenerate_and_invalid_inputs(self):
        p=polygon_initial()
        for a,l in [(0,.2),(.1,-.2),(.1,np.nan)]:
            with self.assertRaises(ValueError): polygon_history(p,a,l)
        with self.assertRaises(ValueError): polygon_values([[0,0],[0,0],[1,1]])
        with self.assertRaises(ValueError): polygon_history(p[::-1],.1,.2)
        self.assertFalse(is_simple(np.array([[0,0],[1,1],[0,1],[1,0]])))

    def test_delivered_trajectories_match_math_and_gif_frames(self):
        from PIL import Image
        summary=json.loads((ROOT/'results/L14_2026_polygon_summary.json').read_text())
        self.assertEqual(len(summary['cases']),6)
        p=np.loadtxt(ROOT/'data/L14_2026_polygon17_initial.csv',delimiter=',',skiprows=1)
        np.testing.assert_allclose(p,polygon_initial(),atol=1e-15)
        for case in summary['cases']:
            saved=np.load(ROOT/'results'/case['trajectory'])
            np.testing.assert_allclose(saved['vertices'],polygon_history(p,case['alpha'],case['lambda']),atol=1e-12)
            with Image.open(ROOT/'results'/case['gif']) as img:
                self.assertEqual(img.n_frames,46)


class TutorialTests(unittest.TestCase):
    def test_row_probability_chain(self):
        T=np.array([[.65,.28,.07],[.15,.67,.18],[.12,.36,.52]])
        p=np.array([.72,.19,.09])
        np.testing.assert_allclose(p@T,[.5073,.3613,.1314])
        for _ in range(200): p=p@T
        np.testing.assert_allclose(p,[.286501377410468,.48852157943067,.224977043158862],atol=1e-12)
        np.testing.assert_allclose(T.T@p,p,atol=1e-14)
        self.assertAlmostEqual(p.sum(),1,places=13)

    def test_matrix_derivatives_and_exponential(self):
        rng=np.random.default_rng(56)
        A=rng.normal(size=(2,3));B=rng.normal(size=(3,3));x=rng.normal(size=3)
        grad=A@(B+B.T);h=1e-6
        for i in range(2):
            for j in range(3):
                plus=A.copy();minus=A.copy();plus[i,j]+=h;minus[i,j]-=h
                d=(np.trace(plus@B@plus.T)-np.trace(minus@B@minus.T))/(2*h)
                self.assertAlmostEqual(d,grad[i,j],places=7)
        F=np.array([[0.,1],[0.,0]])
        from scipy.linalg import expm
        np.testing.assert_allclose(expm(F*2.4),np.eye(2)+F*2.4,atol=1e-14)


if __name__ == '__main__': unittest.main()
