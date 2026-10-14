"""本轮试点的结构保护与数值核验；需 Git 基线 c43b67d、NumPy、SciPy。

从任意目录运行 python 教学化重写/核验试点.py。
默认仅复查试点算例；全书核验请运行核验全书.py。
--historical-scope 只供恢复到试点版本时检查当时正文边界，不用于当前全书。
不代替逐项人工内容对照。
"""
from pathlib import Path
import csv
import itertools
import json
import math
import re
import subprocess
import sys
import numpy as np
from scipy.integrate import quad
from scipy.special import gamma, beta

ROOT = Path(__file__).resolve().parents[1]
BASE = 'c43b67d'
NOTES = ROOT / '系统学习笔记'
checks = []


def passed(name):
    checks.append(name)


def old(relative):
    return subprocess.check_output(['git', 'show', f'{BASE}:{relative}'], cwd=ROOT).decode()


def mask_sections(text, anchors):
    for anchor in anchors:
        start = text.index(f'<a id="{anchor}"></a>')
        end = text.find('\n<a id=', start + 1)
        if end == -1:
            end = len(text)
        text = text[:start] + f'<PILOT {anchor}>' + text[end:]
    return text


scopes = {
    '02_第二章_参数估计与最小二乘.md': ['c2-s3'],
    '05_第五章_样本偏差过拟合与正则化.md': ['c5-s1', 'c5-s3'],
}
NUMERIC_ONLY = '--historical-scope' not in sys.argv
knowledge = list(csv.DictReader((NOTES / '知识点覆盖索引.tsv').open(), delimiter='\t'))
page_rows = list(csv.DictReader((NOTES / 'PPT逐页覆盖索引.tsv').open(), delimiter='\t'))
if not NUMERIC_ONLY:
    for file in sorted(NOTES.glob('0[1-6]_*.md')):
        relative = file.relative_to(ROOT).as_posix()
        before, after = old(relative), file.read_text()
        assert mask_sections(before, scopes.get(file.name, [])) == mask_sections(after, scopes.get(file.name, [])), relative
        assert re.findall(r'<a id="([^"]+)"></a>', before) == re.findall(r'<a id="([^"]+)"></a>', after)
        previous = re.findall(r'^#{1,3} .+$', before, re.M)
        current = iter(re.findall(r'^#{1,3} .+$', after, re.M))
        for title in previous:
            assert any(candidate == title for candidate in current), title
    passed('六章原有 H1/H2/H3 顺序及显式锚点保留；仅三个试点区段变化')

    protected = ['00_学习大纲.md', '全课程知识点清单.md',
                 '系统学习笔记/00_阅读指南与统一符号.md',
                 '系统学习笔记/知识点覆盖索引.tsv', '系统学习笔记/PPT逐页覆盖索引.tsv',
                 '系统学习笔记/来源版本记录.json']
    for relative in protected:
        assert (ROOT / relative).read_text() == old(relative), relative
    knowledge = list(csv.DictReader((NOTES / '知识点覆盖索引.tsv').open(), delimiter='\t'))
    page_rows = list(csv.DictReader((NOTES / 'PPT逐页覆盖索引.tsv').open(), delimiter='\t'))
    assert len(knowledge) == len(set(r['编号'] for r in knowledge)) == 300
    for row in knowledge:
        file, anchor = row['正文链接'].split('#')
        assert f'id="{anchor}"' in (ROOT / file).read_text()
    for row in page_rows:
        file, anchor = row['笔记定位'].split('#')
        assert f'id="{anchor}"' in (NOTES / file).read_text()
    passed('大纲、指南、300 条清单、两份索引和来源版本未改；全部正文定位有效')

    for filename in scopes:
        content = (NOTES / filename).read_text()
        assert not any(ord(c) < 32 and c not in '\n\t\r' for c in content)
        assert '\\(' not in content and '\\[' not in content
    passed('试点文件未引入异常控制字符或另一套数学定界符')

samples = np.array(list(itertools.product([0., 2.], repeat=2)))
means = samples.mean(axis=1)
ss = ((samples - means[:, None])**2).sum(axis=1)
np.testing.assert_allclose([means.mean(), (ss/2).mean(), ss.mean(), np.sqrt(ss).mean()], [1, .5, 1, 1/math.sqrt(2)])
np.testing.assert_allclose(((samples-1)**2).sum(axis=1), ss+2*(means-1)**2)
assert .5**2 * (4/4) + (.5*1-1)**2 == .5
passed('样本方差四样本穷举、平方和恒等式、标准差偏差及收缩 MSE 数值')

v = np.array([1.,4.]); w = (1/v)/(1/v).sum()
np.testing.assert_allclose(w, [.8,.2])
np.testing.assert_allclose([w @ [10,12], (w*w*v).sum()], [10.4,.8])
C = np.array([[1.,1.5],[1.5,4.]])
u = np.linalg.solve(C, np.ones(2)); wc = u/u.sum()
np.testing.assert_allclose(wc, [1.25,-.25])
np.testing.assert_allclose([wc@C@wc, w@C@w, np.linalg.det(C)], [.875,1.28,1.75])
passed('独立融合、相关负权、最优方差与误用独立权的实际方差')

P = np.array([[.95,.03],[.05,.97]])
p0 = np.array([.8,.2]); pi = np.array([3/8,5/8])
np.testing.assert_allclose(P.sum(axis=0), 1)
np.testing.assert_allclose(P@p0, [.766,.234])
np.testing.assert_allclose(P@P@p0, [.73472,.26528])
np.testing.assert_allclose(P@pi, pi)
for k in [1,2,10,50,300]:
    probability = np.linalg.matrix_power(P,k)@p0
    np.testing.assert_allclose(probability[0], 3/8+.92**k*(.8-3/8))
alt = np.array([[0,1],[1,0]])
np.testing.assert_array_equal(alt@alt, np.eye(2))
np.testing.assert_allclose(alt@np.array([.5,.5]), [.5,.5])
assert not np.allclose(alt@np.array([1.,0.]), [.5,.5])
P0 = np.array([[0,0,1],[1,0,0],[0,1,0.]])
teleport = .85*P0+.15*np.array([.2,.3,.5])[:,None]*np.ones((1,3))
assert np.all(teleport > 0)
np.testing.assert_allclose(teleport.sum(axis=0), 1)
passed('Markov 两步递推、稳态、闭式收敛、周期反例及跳转概率守恒')

for a in [.5,1,1.5,2,2.5,5]:
    integral = quad(lambda t: t**(a-1)*math.exp(-t),0,np.inf)[0]
    np.testing.assert_allclose(integral,gamma(a),rtol=1e-9)
    np.testing.assert_allclose(gamma(a+1),a*gamma(a))
for a,b in [(.5,.5),(1.5,2),(2,3)]:
    integral = quad(lambda t: t**(a-1)*(1-t)**(b-1),0,1)[0]
    np.testing.assert_allclose(integral,beta(a,b),rtol=1e-9)
    np.testing.assert_allclose(beta(a,b),gamma(a)*gamma(b)/gamma(a+b))
volume = lambda d: math.pi**(d/2)/gamma(d/2+1)
np.testing.assert_allclose([volume(d) for d in [1,2,3]], [2,math.pi,4*math.pi/3])
assert np.argmax([volume(d) for d in range(1,31)])+1 == 5
for d in [1,2,3,10,20]:
    radial = quad(lambda r: math.exp(-r*r)*r**(d-1),0,np.inf)[0]
    np.testing.assert_allclose(d*volume(d)*radial,math.pi**(d/2),rtol=1e-9)
ratio = lambda d: volume(d)/2**d
np.testing.assert_allclose([ratio(d) for d in [2,3,10,20]],[.785398,.523599,.00249039,2.46114e-8],rtol=2e-6)
for d in range(1,30):
    np.testing.assert_allclose(ratio(d+2)/ratio(d),math.pi/(2*(d+2)))
np.testing.assert_allclose([.01**(1/d) for d in [2,10,100]],[.1,.6309573445,.9549925860],rtol=1e-9)
np.testing.assert_allclose([1-.9**d for d in [2,10,100]],[.19,.6513215599,.9999734386],atol=1e-10)
passed('Gamma/Beta 积分与递推、高维球径向积分、低维及峰值、体积比例和球壳概率')

# Var(Z^2)=8 for Z~N(0,2), independently checked by Gaussian integration.
second = quad(lambda z:z*z*math.exp(-z*z/4)/math.sqrt(4*math.pi),-np.inf,np.inf)[0]
fourth = quad(lambda z:z**4*math.exp(-z*z/4)/math.sqrt(4*math.pi),-np.inf,np.inf)[0]
np.testing.assert_allclose([second,fourth-second**2],[2,8])
for mean,variance,expected in [(1.5,.1,1.35),(2.,1.,2.)]:
    predictions = [mean-math.sqrt(variance),mean+math.sqrt(variance)]
    test_values = [1.,3.]
    errors = [(y-pred)**2 for y,pred in itertools.product(test_values,predictions)]
    np.testing.assert_allclose(np.mean(errors),expected)
folds=[set(range(i,i+4)) for i in [0,4,8]]
assert set.union(*folds)==set(range(12)) and all(len(f)==4 for f in folds)
assert all(not folds[i]&folds[j] for i in range(3) for j in range(i))
passed('Gaussian 距离平方矩、偏差—方差两模型构造例、12 样本三折划分')

result={'date':'2026-10-14','baseline':BASE,'knowledge_entries':len(knowledge),
        'page_index_entries':len(page_rows),'passed':checks,
        'limits':'这些程序检查不替代人工语义核对、原页复核或读者风格审阅。'}
if not NUMERIC_ONLY:
    (ROOT/'教学化重写/核验结果.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for item in checks:print('PASS',item)
