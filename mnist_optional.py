"""Optional L13 MNIST comparison. Needs torch and torchvision.

Downloads official MNIST on first run. Runs 2 MLP depths and 2 CNN depths
with both SGD and Adam, using the same deterministic train/validation/test split.
"""
from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

OUT = Path(__file__).resolve().parent / "results"
DATA = Path(__file__).resolve().parent / "mnist_data"


class MLP(nn.Module):
    def __init__(self, depth: int):
        super().__init__()
        layers: list[nn.Module] = [nn.Flatten()]
        width=784
        for _ in range(depth):
            layers.extend([nn.Linear(width,128),nn.ReLU()]);width=128
        layers.append(nn.Linear(width,10))
        self.net=nn.Sequential(*layers)

    def forward(self,x):return self.net(x)


class CNN(nn.Module):
    def __init__(self, depth: int):
        super().__init__()
        blocks: list[nn.Module] = []
        width=1
        for _ in range(depth):
            blocks.extend([nn.Conv2d(width,16,3,padding=1),nn.ReLU(),nn.MaxPool2d(2)])
            width=16
        self.features=nn.Sequential(*blocks)
        side=28//(2**depth)
        self.head=nn.Sequential(nn.Flatten(),nn.Linear(16*side*side,64),nn.ReLU(),nn.Linear(64,10))

    def forward(self,x):return self.head(self.features(x))


@torch.no_grad()
def evaluate(model,loader,device):
    model.eval();correct=0;total=0;confusion=torch.zeros((10,10),dtype=torch.int64)
    for x,y in loader:
        pred=model(x.to(device)).argmax(dim=1).cpu()
        correct+=(pred==y).sum().item();total+=len(y)
        for a,b in zip(y.tolist(),pred.tolist()):confusion[a,b]+=1
    return correct/total,confusion.tolist()


def one_run(name,optimizer_name,train_loader,val_loader,test_loader,device,epochs,seed):
    torch.manual_seed(seed);np.random.seed(seed);random.seed(seed)
    train_loader.generator.manual_seed(seed)
    kind,depth=name.split("_");depth=int(depth)
    model=(MLP(depth) if kind=="MLP" else CNN(depth)).to(device)
    if optimizer_name=="SGD":opt=torch.optim.SGD(model.parameters(),lr=.05,momentum=.9)
    else:opt=torch.optim.Adam(model.parameters(),lr=.001)
    criterion=nn.CrossEntropyLoss()
    t0=time.perf_counter();history=[]
    for epoch in range(epochs):
        model.train();loss_sum=0.;count=0
        for x,y in train_loader:
            x,y=x.to(device),y.to(device)
            opt.zero_grad(set_to_none=True)
            loss=criterion(model(x),y);loss.backward();opt.step()
            loss_sum+=loss.item()*len(y);count+=len(y)
        val_accuracy,_=evaluate(model,val_loader,device)
        history.append({"epoch":epoch+1,"train_loss":loss_sum/count,"val_accuracy":val_accuracy})
    test_accuracy,confusion=evaluate(model,test_loader,device)
    return {"architecture":name,"optimizer":optimizer_name,"parameters":sum(p.numel() for p in model.parameters()),
            "epochs":epochs,"train_seconds":time.perf_counter()-t0,"history":history,
            "test_accuracy":test_accuracy,"confusion_matrix":confusion}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--epochs",type=int,default=3)
    parser.add_argument("--batch-size",type=int,default=128)
    args=parser.parse_args()
    if args.epochs<1 or args.batch_size<1:raise ValueError("epochs and batch size must be positive")
    seed=20260924
    torch.manual_seed(seed)
    transform=transforms.ToTensor()
    train_all=datasets.MNIST(DATA,train=True,download=True,transform=transform)
    test=datasets.MNIST(DATA,train=False,download=True,transform=transform)
    rng=np.random.default_rng(seed);ids=rng.permutation(len(train_all))
    train_ids,val_ids=ids[:50000],ids[50000:]
    train_loader=DataLoader(Subset(train_all,train_ids),batch_size=args.batch_size,shuffle=True,
                            generator=torch.Generator().manual_seed(seed),num_workers=0)
    val_loader=DataLoader(Subset(train_all,val_ids),batch_size=args.batch_size,shuffle=False,num_workers=0)
    test_loader=DataLoader(test,batch_size=args.batch_size,shuffle=False,num_workers=0)
    device="mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
    results=[]
    for name in ["MLP_1","MLP_3","CNN_1","CNN_2"]:
        for optimizer in ["SGD","Adam"]:
            results.append(one_run(name,optimizer,train_loader,val_loader,test_loader,device,args.epochs,seed))
            print(name,optimizer,results[-1]["test_accuracy"])
    OUT.mkdir(exist_ok=True)
    (OUT/"L13_mnist_optional.json").write_text(json.dumps({"seed":seed,"device":device,
        "train_n":50000,"validation_n":10000,"test_n":len(test),"results":results},indent=2)+"\n")


if __name__=="__main__":main()
