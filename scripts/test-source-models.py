"""No scientific dependencies; CI executes the exact conjugation and kernel helpers."""
import cmath
import math
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from source_models import cross_spectrum,isotropic_kde_at

class SourceModels(unittest.TestCase):
    def test_delayed_signal_phase(self):
        n,k,d=128,5,3
        x=[math.cos(2*math.pi*k*j/n) for j in range(n)]
        y=[x[(j-d)%n] for j in range(n)]
        dft=lambda a:sum(v*cmath.exp(-2j*math.pi*k*j/n) for j,v in enumerate(a))
        phase=cmath.phase(cross_spectrum(dft(x),dft(y)))
        self.assertAlmostEqual(phase,-2*math.pi*k*d/n,places=12)
    def test_original_unit_kernel(self):
        for scale in [.3,1,2]:
            self.assertAlmostEqual(isotropic_kde_at(0,0,[[0,0]],scale),1/(2*math.pi*scale**2))
            self.assertAlmostEqual(isotropic_kde_at(scale,0,[[0,0]],scale)/isotropic_kde_at(0,0,[[0,0]],scale),math.exp(-.5))
        self.assertNotEqual(isotropic_kde_at(0,0,[[0,0]],1),isotropic_kde_at(0,0,[[0,0]],.3))
    def test_invalid(self):
        for s in [0,-1,math.nan,math.inf]:
            with self.assertRaises(ValueError):isotropic_kde_at(0,0,[[0,0]],s)
        for data in [[],[[0]],[[math.inf,0]]]:
            with self.assertRaises(ValueError):isotropic_kde_at(0,0,data,1)
if __name__=='__main__':unittest.main()
