"""Report source PPT/PDF changes without marking them reviewed."""
from pathlib import Path
import argparse
import hashlib
import json
import sys


def main():
    repo = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, default=repo.parent)
    args = parser.parse_args()
    source = args.source_root.resolve()
    if not (source / '26PPT').is_dir() or not (source / '25PPT').is_dir():
        print('未找到 25PPT/26PPT，请用 --source-root 指定外层课程资料目录。', file=sys.stderr)
        return 1
    records = json.loads((repo / '系统学习笔记/来源版本记录.json').read_text())
    known = {entry['file']: entry['sha256'] for entry in records}
    changed = False
    actual = {p.relative_to(source).as_posix(): p for folder in ['25PPT', '26PPT'] for p in (source / folder).iterdir() if p.suffix.lower() in {'.pdf', '.ppt', '.pptx'}}
    for relative, digest in known.items():
        file = actual.get(relative)
        if file is None:
            print('缺失：', relative); changed = True
        elif hashlib.sha256(file.read_bytes()).hexdigest() != digest:
            print('修改：', relative); changed = True
    for relative in sorted(actual.keys() - known.keys()):
        print('新增：', relative); changed = True
    if not changed:
        print(f'{len(known)} 份课件与当前来源记录一致。')
    else:
        print('请审阅变化并同步知识点、笔记、原题、答案、代码和版本记录。')
    return 2 if changed else 0


if __name__ == '__main__':
    raise SystemExit(main())
