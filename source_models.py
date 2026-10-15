"""Small source conventions shared by homework figures and dependency-free checks."""
import math


def cross_spectrum(x, y):
    """S_xy = conjugate(X) Y; a positive delay of y has negative phase."""
    return x.conjugate() * y


def isotropic_kde_at(x, y, samples, scale):
    """Two-dimensional Gaussian kernels with covariance scale**2 I.

    x, y and scale use the same original coordinate unit, not Scott multipliers.
    """
    if not math.isfinite(scale) or scale <= 0 or not all(map(math.isfinite, (x, y))):
        raise ValueError("finite coordinates and positive scale required")
    if len(samples) == 0:
        raise ValueError("nonempty samples required")
    if any(len(row) != 2 or not all(map(math.isfinite, row)) for row in samples):
        raise ValueError("finite two-dimensional samples required")
    return sum(math.exp(-((x-a)**2+(y-b)**2)/(2*scale**2))
               for a, b in samples) / (len(samples)*2*math.pi*scale**2)
