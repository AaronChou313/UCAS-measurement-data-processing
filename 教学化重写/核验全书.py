"""全书结构、原文区块保留及关键教学算例核验。

运行：python3 教学化重写/核验全书.py；依赖 requirements.txt。
原文比较基线 c43b67d；三个试点另有 52 项人工对照记录。
有限程序检查不等同于对全部数学结论的形式化证明。
"""
from pathlib import Path
import csv
import hashlib
import itertools
import json
import re
import subprocess
import sys
import numpy as np
from scipy.integrate import quad
from scipy.linalg import expm
from scipy.signal import hilbert, correlate2d
from scipy.special import digamma
from scipy.stats import kendalltau, spearmanr, chi2

ROOT = Path(__file__).resolve().parents[1]
NOTES = ROOT / '系统学习笔记'
BASE = 'c43b67d'
checks = []
close = np.testing.assert_allclose


def passed(name):
    checks.append(name)
    print('PASS', name)


def baseline(relative):
    return subprocess.check_output(['git', 'show', f'{BASE}:{relative}'], cwd=ROOT).decode()


def sections(text):
    matches = list(re.finditer(r'<a id="(c\d-s\d+)"></a>', text))
    return {m[1]: text[m.start():matches[i+1].start() if i+1 < len(matches) else len(text)]
            for i, m in enumerate(matches)}


pilot = {'c2-s3', 'c5-s1', 'c5-s3'}
corrections = {
    '正态方差满足 $(n-1)s^2/\\sigma^2\\sim\\chi^2_{n-1}$，区间为':
        '在抽样前，正态样本方差满足 $(n-1)S^2/\\sigma^2\\sim\\chi^2_{n-1}$；观测后将实现值 $s^2$ 代入，区间为',
    '令 $\\boldsymbol\\beta\\sim N(\\mathbf m_0,C_0)$，$\\mathbf y\\mid\\boldsymbol\\beta\\sim N(X\\boldsymbol\\beta,C_\\varepsilon)$，且协方差已知、独立。将负对数后验二次型配方得':
        '令 $\\boldsymbol\\beta\\sim N(\\mathbf m_0,C_0)$，$\\mathbf y\\mid\\boldsymbol\\beta\\sim N(X\\boldsymbol\\beta,C_\\varepsilon)$，协方差已知且先验参数与加性观测噪声独立。将负对数后验二次型配方得',
}
ledger, paragraph_rows = [], []
totals = {'原文区块保留': 0, '明确修正': 0}
chapter_counts = []
for file in sorted(NOTES.glob('0[1-6]_*.md')):
    relative = file.relative_to(ROOT).as_posix()
    old, new = baseline(relative), file.read_text()
    old_sections, new_sections = sections(old), sections(new)
    assert list(old_sections) == list(new_sections), file.name
    headings = iter(re.findall(r'^#{1,3} .+$', new, re.M))
    for heading in re.findall(r'^#{1,3} .+$', old, re.M):
        assert any(candidate == heading for candidate in headings), heading
    assert not any(ord(c) < 32 and c not in '\n\t\r' for c in new)
    assert '\\(' not in new and '\\[' not in new
    chapter_counts.append({'章': file.name, '原文字数含公式': len(old), '新文字数含公式': len(new)})
    for anchor, before in old_sections.items():
        after = new_sections[anchor]
        title = re.search(r'^## (.+)$', before, re.M)[1]
        if anchor in pilot:
            ledger.append([anchor, title, '52 项人工保留核对；数值例独立核验', '试点保留核对.tsv'])
            continue
        count, fixed = 0, 0
        for block in re.split(r'\n\s*\n', before):
            if not block.strip():
                continue
            digest = hashlib.sha256(block.encode()).hexdigest()
            if block in after:
                state = '原文区块保留'
                count += 1
            else:
                assert block in corrections and corrections[block] in after, (anchor, block)
                state = '明确修正'
                fixed += 1
            totals[state] += 1
            paragraph_rows.append([anchor, digest, state, block[:150].replace('\n', ' ').rstrip()])
        ledger.append([anchor, title, f'{count} 个原文区块保留；{fixed} 个明确修正', '全书原文区块核对.tsv'])
passed('六章原有标题顺序与显式锚点保留；逐节检查非试点原文区块及两项明确修正')

protected = ['00_学习大纲.md', '全课程知识点清单.md', '系统学习笔记/00_阅读指南与统一符号.md',
             '系统学习笔记/知识点覆盖索引.tsv', '系统学习笔记/PPT逐页覆盖索引.tsv',
             '系统学习笔记/来源版本记录.json']
for relative in protected:
    assert (ROOT / relative).read_text() == baseline(relative), relative
knowledge = list(csv.DictReader((NOTES/'知识点覆盖索引.tsv').open(), delimiter='\t'))
pages = list(csv.DictReader((NOTES/'PPT逐页覆盖索引.tsv').open(), delimiter='\t'))
assert len(knowledge) == len({r['编号'] for r in knowledge}) == 300
assert len(pages) == 2439
for row in knowledge:
    name, anchor = row['正文链接'].split('#')
    assert f'id="{anchor}"' in (ROOT/name).read_text()
for row in pages:
    name, anchor = row['笔记定位'].split('#')
    assert f'id="{anchor}"' in (NOTES/name).read_text()
for (_, lesson), group in itertools.groupby(sorted(pages, key=lambda r:(r['年份目录'],int(r['课次']),int(r['PDF页码']))),
                                           key=lambda r:(r['年份目录'],r['课次'])):
    group = list(group)
    assert [int(r['PDF页码']) for r in group] == list(range(1,len(group)+1)), lesson
passed('300 条知识定位、2439 页来源定位与连续页码有效；大纲、符号指南和来源记录未改')

# Historical pilot math is kept executable without claiming that the other chapters are unchanged.
result = subprocess.run([sys.executable,str(ROOT/'教学化重写/核验试点.py'),'--numeric-only'],
                        cwd=ROOT, capture_output=True,text=True,check=True)
print(result.stdout.strip())
passed('三个试点的五组数值核验复跑通过')

B=np.array([[1.,1],[0,1]])
close(np.linalg.solve(B,[3,1]),[2,1])
q=np.array([1.,2])/np.sqrt(5)
close((np.outer(q,q)@np.array([3.,1.])),[1,2])
population=np.arange(1.,6.)
sample_means=[np.mean(c) for c in itertools.combinations(population,2)]
close(np.var(sample_means),np.var(population)/2*(5-2)/(5-1))
close([1/(1/4+1),3/(1/4+1)],[.8,2.4])
from scipy.optimize import brentq
positive=np.array([1.,2.,4.,5.])
gap=np.log(positive.mean())-np.log(positive).mean()
k=brentq(lambda k:np.log(k)-digamma(k)-gap,.01,100)
theta=positive.mean()/k
close([np.sum(positive)/theta**2-len(positive)*k/theta,
       np.log(positive).sum()-len(positive)*np.log(theta)-len(positive)*digamma(k)],0,atol=1e-10)
passed('第一、二章换基投影、不放回修正、Gamma 得分方程和高斯后验数值')

x=np.array([0.,1,2]); y=np.array([1.,2,2]); X=np.column_stack([np.ones(3),x])
b=np.linalg.lstsq(X,y,rcond=None)[0]; fitted=X@b; e=y-fitted
sse=e@e; ssr=np.sum((fitted-y.mean())**2); sst=np.sum((y-y.mean())**2)
close(b,[7/6,.5]); close([sse,ssr,sst],[1/6,.5,2/3]);close(sst,sse+ssr)
close((b[1]/np.sqrt(sse*np.linalg.inv(X.T@X)[1,1]))**2,ssr/sse)
close([kendalltau([1,2,3],[1,3,2]).statistic,spearmanr([1,2,3],[1,3,2]).statistic],[1/3,.5])
wave=3*np.cos(2*np.pi*np.arange(8)/8); fft=np.fft.fft(wave)
close(2*abs(fft[1])/8,3);close(np.sum(abs(fft)**2)/8,np.sum(wave**2))
close(np.sum((.1/8*abs(fft)**2)*(1/.8)),4.5)
j=np.arange(100)
close(np.cos(2*np.pi*60*j/100),np.cos(2*np.pi*40*j/100),atol=1e-12)
close(np.convolve([1,2],[1,1]),[1,3,2])
passed('第三章回归平方和与 t²=F、秩相关、DFT 幅度/功率、混叠及卷积算例')

Cx=np.array([[.01,.005],[.005,.01]])
close(np.array([3,2])@Cx@np.array([3,2]),.19)
close(6+Cx[0,1],6.005)
C=np.array([[4.,1],[1,1]])
values,vectors=np.linalg.eigh(C); close(values,[(5-np.sqrt(13))/2,(5+np.sqrt(13))/2])
close(chi2.cdf(-2*np.log(.05),2),.95)
close(np.degrees(.5*np.arctan2(2,3)),16.84503376299)
L=np.linalg.cholesky(C);close(L@L.T,C)
close(quad(lambda r:r**3,0,1)[0],.25)
A=np.array([[1.,1],[0,0]])
close(np.linalg.pinv(A)@np.array([2,1]),[1,1])
center=np.array([2.,-1]);Q=np.array([[2.,.5],[.5,1.]])
linear=-2*Q@center;level=3.;constant=center@Q@center-level
angles=np.linspace(0,2*np.pi,24);v,U=np.linalg.eigh(Q)
points=center[:,None]+U@((np.sqrt(level/v)[:,None])*np.array([np.cos(angles),np.sin(angles)]))
close(np.einsum('in,ij,jn->n',points,Q,points)+linear@points+constant,0,atol=1e-13)
passed('第四章相关面积传播、椭圆方向与概率、矩比例、广义逆及二次式配方')

sig=np.array([10.,.1]);close(sig**2/(sig**2+1),[100/101,.01/1.01])
z=np.array([3.,.4,-2]);close(np.sign(z)*np.maximum(abs(z)-1,0),[2,0,-1])
D1=np.diff(np.eye(4),axis=0);D2=np.diff(np.eye(4),n=2,axis=0)
close(D1@np.ones(4),0);close(D2@np.arange(4.),0)
passed('第五章 Ridge 不同方向收缩、Lasso 阈值及差分算子零空间')

rng=np.random.default_rng(20261014)
A=rng.normal(size=(6,4));u,s,vt=np.linalg.svd(A,full_matrices=False)
close(u@np.diag(s)@vt,A,atol=1e-14)
Ak=(u[:,:2]*s[:2])@vt[:2]
close([np.linalg.norm(A-Ak,'fro')**2,np.linalg.norm(A-Ak,2)],[sum(s[2:]**2),s[2]])
body=(NOTES/'06_第六章_时空分析状态估计与神经网络.md').read_text()
code=re.search(r'```python\n(.*?)```',body,re.S)[1];namespace={};exec(compile(code,'正文PCA','exec'),namespace)
data=rng.normal(size=(20,4));mean,comp,scores,ev,ratio,recon=namespace['pca'](data)
close(recon,data,atol=1e-14);close(scores.T@scores/19,np.diag(ev),atol=1e-14)
t=2*np.pi*np.arange(64)/64;space=np.array([0.,.3,.8])
field=np.cos(t[:,None]-space[None,:]);analytic=hilbert(field,axis=0)
close(analytic,np.exp(1j*t[:,None]-1j*space[None,:]),atol=1e-14)
ua,sa,vha=np.linalg.svd(analytic,full_matrices=False)
close((ua[:,:1]*sa[:1])@vha[:1],analytic,atol=1e-14)
source1=np.array([-1.,1]);weights1=np.array([.5,.5])
source2=np.array([-np.sqrt(3),0,np.sqrt(3)]);weights2=np.array([1/6,2/3,1/6])
fobi=np.zeros((2,2))
for i,j in itertools.product(range(2),range(3)):
    sample=np.array([source1[i],source2[j]])
    fobi+=weights1[i]*weights2[j]*(sample@sample)*np.outer(sample,sample)
close(fobi,np.diag([2.,4]))
passed('第六章 SVD 误差、正文 PCA 代码、Hilbert/CEOF 相位重建和 FOBI 四阶方向')

Pminus=np.array([[4.,1],[1,2]]);H=np.array([[1.,0]]);R=np.array([[1.]])
S=H@Pminus@H.T+R;K=np.linalg.solve(S,H@Pminus).T
close(K[:,0],[.8,.2]);close(np.array([10.,1])+K[:,0]*2,[11.6,1.4])
residual=np.eye(2)-K@H
Pplus=residual@Pminus@residual.T+K@R@K.T
close(Pplus,[[.8,.2],[.2,1.8]])
close(Pplus,Pminus-K@S@K.T)
for _ in range(10):
    alternative=K+rng.normal(size=(2,1))
    rmat=np.eye(2)-alternative@H
    covariance=rmat@Pminus@rmat.T+alternative@R@alternative.T
    assert np.linalg.eigvalsh(covariance-Pplus).min()>-1e-12
Fgenerator=np.array([[0.,1],[0,0]]);B=np.array([0.,1.]);dt=.7
Q=np.array([[quad(lambda tau: (expm(Fgenerator*tau)@B)[i]*(expm(Fgenerator*tau)@B)[j],0,dt)[0]
             for j in range(2)] for i in range(2)])
close(Q,[[dt**3/3,dt**2/2],[dt**2/2,dt]])
close(np.linalg.det(np.outer([dt**2/2,dt],[dt**2/2,dt])),0,atol=1e-15)
passed('Kalman 二维增益、Joseph 与配方最优性、连续驱动积分及离散驱动秩')

def finite_gradient(fun,arg):
    out=np.zeros_like(arg); step=1e-5
    for index in np.ndindex(arg.shape):
        plus=arg.copy();minus=arg.copy();plus[index]+=step;minus[index]-=step
        out[index]=(fun(plus)-fun(minus))/(2*step)
    return out

close(finite_gradient(lambda a:(a[0]*2+a[1]-3)**2/2,np.array([.5,0.])),[-4,-2],atol=1e-9)
logits=np.array([.2,-.3,1.1]);target=np.array([0.,0,1.])
prob=np.exp(logits-logits.max());prob/=prob.sum()
def ce(a):
    shifted=a-a.max()
    return -(shifted[-1]-np.log(np.exp(shifted).sum()))
close(finite_gradient(ce,logits),prob-target,atol=1e-9)
for timestep in [1,2,10]:
    close(sum((1-.9)*.9**j*2 for j in range(timestep))/(1-.9**timestep),2)
image=np.arange(1.,10).reshape(3,3);kernel=np.array([[1.,0],[0,-1]])
close(correlate2d(image,kernel,mode='valid'),np.full((2,2),-4))
close(finite_gradient(lambda k:correlate2d(image,k,mode='valid').sum(),kernel),[[12,16],[24,28]],atol=1e-8)
assert 16*(3*3*3+1)==448
passed('NN 仿射与交叉熵反向有限差分、Adam 初值校正、CNN 输出与共享核梯度')

for filename,header,rows in [
    ('全书逐节保留核对.tsv',['锚点','小节','原文保留检查','证据文件'],ledger),
    ('全书原文区块核对.tsv',['锚点','原文SHA256','处理','原文摘要'],paragraph_rows),
]:
    with (ROOT/'教学化重写'/filename).open('w') as stream:
        writer=csv.writer(stream,delimiter='\t',lineterminator='\n');writer.writerow(header);writer.writerows(rows)
report={'date':'2026-10-14','baseline':BASE,'knowledge_entries':len(knowledge),'page_index_entries':len(pages),
        'sections':len(ledger),'paragraphs_outside_pilot':totals,'chapters':chapter_counts,'passed':checks,
        'limits':'原文区块保留与三节人工清单共同防遗漏；数值及结构检查不替代语义、数学审阅或真实学习效果测试。'}
(ROOT/'教学化重写/全书核验结果.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
