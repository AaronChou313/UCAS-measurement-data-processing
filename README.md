# 中国科学院大学《测量数据处理理论与方法》课程资料

本仓库整理了中国科学院大学《测量数据处理理论与方法》课程的课件、参考资料、实践程序和示例数据，供课程学习与复习使用。

## 目录说明

```text
.
├── 1-reference/   # 参考书、论文及扩展阅读资料
├── 2-practice/    # Python 实践代码及相关程序
├── 3-datas/       # 课程实践所用示例数据
└── 4-25PPT/       # 2025 年课程课件
```

## 克隆前请先安装 Git LFS

本仓库使用 [Git LFS（Large File Storage）](https://git-lfs.com/) 管理 PDF、电子书和压缩包等大文件。若未安装 Git LFS，克隆后可能只能得到体积很小的 LFS 指针文件，而不是实际课程资料。

请先安装 Git 和 Git LFS，再克隆本仓库。

### Windows

任选一种方式安装 Git LFS：

```powershell
# 使用 winget
winget install GitHub.GitLFS

# 或使用 Chocolatey
choco install git-lfs
```

也可以从 [Git LFS 官网](https://git-lfs.com/) 下载安装程序。安装完成后，在 PowerShell 或 Git Bash 中执行：

```bash
git lfs install
```

### macOS

推荐使用 Homebrew：

```bash
brew install git-lfs
git lfs install
```

如果尚未安装 Homebrew，也可以从 [Git LFS 官网](https://git-lfs.com/) 下载安装包。

### Linux

Ubuntu / Debian：

```bash
sudo apt update
sudo apt install git-lfs
git lfs install
```

Fedora：

```bash
sudo dnf install git-lfs
git lfs install
```

Arch Linux：

```bash
sudo pacman -S git-lfs
git lfs install
```

其他 Linux 发行版请参考 [Git LFS 安装说明](https://github.com/git-lfs/git-lfs#installing)。

## 克隆仓库

安装并初始化 Git LFS 后，执行：

```bash
git clone <本仓库地址>
cd UCAS-measurement-data-processing
```

正常情况下，`git clone` 会自动下载 LFS 文件。若大文件没有自动下载，可在仓库目录中执行：

```bash
git lfs pull
```

## 已经克隆但未安装 Git LFS

无需重新克隆。安装 Git LFS 后进入仓库目录，执行：

```bash
git lfs install
git lfs pull
```

可使用以下命令确认 Git LFS 是否安装成功，并查看仓库中的 LFS 文件：

```bash
git lfs version
git lfs ls-files
```

## Git LFS 管理的文件类型

本仓库当前通过 `.gitattributes` 使用 Git LFS 管理以下类型：

- PDF：`.pdf`
- 电子书：`.epub`、`.mobi`
- 压缩包：`.zip`、`.rar`、`.7z`

## 使用说明

- 课程资料仅供学习与交流使用。
- 部分参考资料的版权归原作者及出版机构所有，请勿用于商业用途或未经授权的传播。
- 仓库中的代码和数据可能需要根据本地 Python 环境进行适配。

