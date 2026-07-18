#!/usr/bin/env python3
"""本文の図(images/*.png)を生成するスクリプト。

ASCII図では表現が粗くなる「散布図・ベクトルの矢印・等高線」系の図を、
matplotlib で正確に描画する。実行には Python 3 + matplotlib が必要。

    python3 scripts/generate-figures.py

数値は本文中の手計算例と一致させること。
"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager

OUT = os.path.join(os.path.dirname(__file__), '..', 'images')
os.makedirs(OUT, exist_ok=True)

for f in ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP']:
    if any(f == x.name for x in font_manager.fontManager.ttflist):
        plt.rcParams['font.family'] = f
        break
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['savefig.facecolor'] = 'white'

BLUE, ORANGE, GREEN, RED, GRAY = '#1f6feb', '#e36209', '#1a7f37', '#cf222e', '#57606a'


def save(fig, name):
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, name), dpi=160)
    plt.close(fig)
    print('generated:', name)


def arrow(ax, start, end, color, lw=2.2):
    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle='-|>', lw=lw, color=color,
                                shrinkA=0, shrinkB=0, mutation_scale=18))


# ---- 第2章 2.3.2 内積の3パターン ----------------------------------------
def ch02_dot_product_patterns():
    fig, axes = plt.subplots(1, 3, figsize=(10.5, 3.6))
    cases = [
        ('同じ向き → 内積 7(大きい正)', [
            ((3, 1), 'a = (3, 1)', BLUE, (3.1, 0.7)),
            ((2, 1), 'b = (2, 1)', ORANGE, (0.7, 1.35)),
        ]),
        ('直角 → 内積 0', [
            ((2, 0), 'a = (2, 0)', BLUE, (2.15, 0.15)),
            ((0, 2), 'c = (0, 2)', ORANGE, (0.2, 2.1)),
        ]),
        ('逆向き → 内積 −5(負)', [
            ((2, 1), 'a = (2, 1)', BLUE, (2.15, 1.05)),
            ((-2, -1), 'd = (−2, −1)', ORANGE, (-2.9, -1.7)),
        ]),
    ]
    for ax, (title, vecs) in zip(axes, cases):
        ax.axhline(0, color=GRAY, lw=0.8)
        ax.axvline(0, color=GRAY, lw=0.8)
        for (vx, vy), label, color, (lx, ly) in vecs:
            arrow(ax, (0, 0), (vx, vy), color)
            ax.text(lx, ly, label, fontsize=10, color=color)
        ax.set_xlim(-3.2, 4.2); ax.set_ylim(-2.5, 3)
        ax.set_aspect('equal')
        ax.set_title(title, fontsize=11)
        ax.grid(alpha=0.25)
    save(fig, 'ch02-dot-product-patterns.png')


# ---- 第2章 2.3.4 単語ベクトルの配置 --------------------------------------
def ch02_word_vectors():
    fig, ax = plt.subplots(figsize=(6, 4.2))
    words = [('猫', (2, 1), BLUE), ('犬', (2, 2), BLUE), ('魚', (1, 2), BLUE), ('銀行', (-2, 1), RED)]
    ax.axhline(0, color=GRAY, lw=0.8)
    ax.axvline(0, color=GRAY, lw=0.8)
    for label, (vx, vy), color in words:
        arrow(ax, (0, 0), (vx, vy), color)
        ax.annotate(f'{label} ({vx}, {vy})', (vx, vy), textcoords='offset points',
                    xytext=(6, 6), fontsize=11, color=color)
    ax.set_xlim(-3, 3.2); ax.set_ylim(-0.7, 2.8)
    ax.set_aspect('equal')
    ax.set_title('単語ベクトルの配置: 猫・犬・魚は近い向き、銀行だけ別の向き', fontsize=11)
    ax.grid(alpha=0.25)
    save(fig, 'ch02-word-vectors.png')


# ---- 第2章 2.4.1 ノルム(三平方の定理) ----------------------------------
def ch02_norm():
    fig, ax = plt.subplots(figsize=(5, 4.6))
    ax.axhline(0, color=GRAY, lw=0.8)
    ax.axvline(0, color=GRAY, lw=0.8)
    arrow(ax, (0, 0), (3, 4), BLUE)
    ax.plot([0, 3], [0, 0], '--', color=ORANGE, lw=1.8)
    ax.plot([3, 3], [0, 4], '--', color=GREEN, lw=1.8)
    ax.annotate('a = (3, 4)', (3, 4), textcoords='offset points', xytext=(8, 2), fontsize=11, color=BLUE)
    ax.annotate('‖a‖ = 5(斜辺の長さ)', (1.1, 2.3), fontsize=11, color=BLUE, rotation=49)
    ax.annotate('3', (1.5, -0.35), fontsize=12, color=ORANGE, ha='center')
    ax.annotate('4', (3.15, 2.0), fontsize=12, color=GREEN)
    ax.set_xlim(-0.5, 4.6); ax.set_ylim(-0.8, 4.6)
    ax.set_aspect('equal')
    ax.set_title('ノルム = ベクトルの長さ(直角三角形の斜辺)', fontsize=11)
    ax.grid(alpha=0.25)
    save(fig, 'ch02-norm.png')


# ---- 第2章 2.6.4 90°回転の変換前後 ---------------------------------------
def ch02_rotation():
    fig, axes = plt.subplots(1, 2, figsize=(8.6, 3.9))
    before = [((1, 0), '(1, 0)', BLUE), ((1, 1), '(1, 1)', ORANGE)]
    after = [((0, 1), '(0, 1)', BLUE), ((-1, 1), '(−1, 1)', ORANGE)]
    for ax, vecs, title in [(axes[0], before, '変換前'), (axes[1], after, '変換後(反時計回りに90°回転)')]:
        ax.axhline(0, color=GRAY, lw=0.8)
        ax.axvline(0, color=GRAY, lw=0.8)
        for (vx, vy), label, color in vecs:
            arrow(ax, (0, 0), (vx, vy), color)
            ax.annotate(label, (vx, vy), textcoords='offset points', xytext=(6, 6), fontsize=11, color=color)
        ax.set_xlim(-1.8, 1.8); ax.set_ylim(-0.6, 1.7)
        ax.set_aspect('equal')
        ax.set_title(title, fontsize=11)
        ax.grid(alpha=0.25)
    fig.suptitle('行列 R に入れると、同じ色の矢印がそれぞれ90°回転して出てくる', fontsize=11, y=1.0)
    save(fig, 'ch02-rotation.png')


# ---- 第3章 3.4.2 勾配と等高線 --------------------------------------------
def ch03_gradient_contour():
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    xs = np.linspace(-4.2, 4.2, 300)
    ys = np.linspace(-3.2, 3.2, 300)
    X, Y = np.meshgrid(xs, ys)
    Z = X**2 + 3 * Y**2
    cs = ax.contour(X, Y, Z, levels=[1, 4, 9, 13, 20], colors=GRAY, linewidths=1)
    ax.clabel(cs, fmt='%d', fontsize=8)
    ax.plot(0, 0, 'x', color=RED, markersize=9, markeredgewidth=2.5)
    ax.annotate('谷底 (0, 0)', (0, 0), textcoords='offset points', xytext=(8, -14), fontsize=10, color=RED)
    p = np.array([1.0, 2.0])
    ax.plot(*p, 'o', color=BLUE, markersize=7)
    ax.annotate('地点 (1, 2)', p, textcoords='offset points', xytext=(8, -4), fontsize=10, color=BLUE)
    g = np.array([2.0, 12.0])
    g_unit = g / np.linalg.norm(g) * 1.6
    arrow(ax, p, p + g_unit, GREEN)
    ax.annotate('∇f(最も急な上り)', p + g_unit, textcoords='offset points', xytext=(6, 2), fontsize=10, color=GREEN)
    arrow(ax, p, p - g_unit, ORANGE)
    ax.annotate('−∇f(最も急な下り)', p - g_unit, textcoords='offset points', xytext=(6, -10), fontsize=10, color=ORANGE)
    ax.set_xlim(-4.2, 4.6); ax.set_ylim(-3.2, 4.2)
    ax.set_aspect('equal')
    ax.set_title('f(x, y) = x² + 3y² を真上から見た等高線と、地点 (1, 2) での勾配', fontsize=11)
    ax.set_xlabel('x'); ax.set_ylabel('y')
    save(fig, 'ch03-gradient-contour.png')


# ---- 第3章 3.7.2 分布の形3類型 -------------------------------------------
def ch03_distribution_shapes():
    fig, axes = plt.subplots(1, 3, figsize=(10.5, 3.2), sharey=True)
    cats = ['A', 'B', 'C', 'D', 'E']
    cases = [
        ('(a) 一様な分布 = 自信なし', [0.2, 0.2, 0.2, 0.2, 0.2]),
        ('(b) 尖った分布 = 自信あり', [0.1, 0.1, 0.6, 0.1, 0.1]),
        ('(c) 2つの山 = 迷い', [0.05, 0.4, 0.1, 0.4, 0.05]),
    ]
    for ax, (title, probs) in zip(axes, cases):
        ax.bar(cats, probs, color=BLUE, width=0.55)
        ax.set_ylim(0, 0.7)
        ax.set_title(title, fontsize=11)
        ax.grid(axis='y', alpha=0.25)
    axes[0].set_ylabel('確率')
    save(fig, 'ch03-distribution-shapes.png')


# ---- 第4章 4.3 家賃データと直線 ------------------------------------------
RENT_X = [20, 25, 30, 40, 50]
RENT_Y = [8.1, 9.0, 10.2, 11.8, 14.1]


def ch04_rent_fit():
    fig, ax = plt.subplots(figsize=(6.6, 4.2))
    ax.scatter(RENT_X, RENT_Y, s=70, color=BLUE, zorder=3, label='データ点(実際の部屋)')
    xs = [15, 55]
    ax.plot(xs, [0.2 * v + 4 for v in xs], color=ORANGE, lw=2, label='引きたい直線  $\\hat{y} = wx + b$')
    ax.set_xlabel('広さ x (m²)'); ax.set_ylabel('家賃 y (万円)')
    ax.set_title('データ点のなるべく近くを通る直線を1本引きたい', fontsize=11)
    ax.set_xlim(15, 55); ax.set_ylim(6, 16)
    ax.grid(alpha=0.3)
    ax.legend(fontsize=10, loc='upper left')
    save(fig, 'ch04-rent-fit.png')


# ---- 第4章 4.9.3 汎化 vs 過学習 ------------------------------------------
def ch04_overfitting():
    fig, axes = plt.subplots(1, 2, figsize=(9.6, 3.9), sharey=True)
    xs = np.linspace(17, 53, 300)
    # 左: 良い当てはめ(直線)
    axes[0].scatter(RENT_X, RENT_Y, s=60, color=BLUE, zorder=3)
    axes[0].plot(xs, 0.2 * xs + 4, color=ORANGE, lw=2)
    axes[0].set_title('(1) 良い当てはめ(汎化)', fontsize=11)
    # 右: 過学習(5点を完璧に通る4次多項式)
    coef = np.polyfit(RENT_X, RENT_Y, 4)
    axes[1].scatter(RENT_X, RENT_Y, s=60, color=BLUE, zorder=3)
    axes[1].plot(xs, np.polyval(coef, xs), color=RED, lw=2)
    axes[1].set_title('(2) 過学習(全5点を完璧に通る複雑な曲線)', fontsize=11)
    for ax in axes:
        ax.set_xlabel('広さ x (m²)')
        ax.set_xlim(16, 54); ax.set_ylim(5, 17)
        ax.grid(alpha=0.3)
    axes[0].set_ylabel('家賃 y (万円)')
    save(fig, 'ch04-overfitting.png')


# ---- 第6章 6.6.3 埋め込み空間 --------------------------------------------
def ch06_embedding_space():
    fig, ax = plt.subplots(figsize=(6.8, 4.8))
    groups = {
        '動物': (BLUE, [('犬', 1, 4), ('猫', 1.7, 4), ('虎', 1.9, 3.6), ('鳥', 0.6, 3)]),
        '食べ物': (ORANGE, [('魚', 3.4, 2), ('肉', 3.9, 2), ('米', 4.0, 1.7)]),
        '感情': (GREEN, [('好き', 0.6, 1), ('嫌い', 1.0, 0.6)]),
        '家具': (RED, [('机', 4.6, 0), ('椅子', 4.4, -0.3)]),
    }
    for gname, (color, pts) in groups.items():
        ax.scatter([p[1] for p in pts], [p[2] for p in pts], s=55, color=color, label=gname, zorder=3)
        for label, px, py in pts:
            ax.annotate(label, (px, py), textcoords='offset points', xytext=(7, 4), fontsize=11, color=color)
    ax.set_xlabel('意味の軸1(たとえば「食べ物らしさ」)')
    ax.set_ylabel('意味の軸2(たとえば「生き物らしさ」)')
    ax.set_title('埋め込み空間のイメージ: 意味が近い単語は近くに集まる', fontsize=11)
    ax.set_xlim(-0.3, 5.6); ax.set_ylim(-1, 4.8)
    ax.grid(alpha=0.25)
    ax.legend(fontsize=10, loc='lower left')
    save(fig, 'ch06-embedding-space.png')


# ---- 第6章 6.7.3 王 − 男 + 女 ≈ 女王 -------------------------------------
def ch06_king_queen():
    fig, ax = plt.subplots(figsize=(6.2, 4.4))
    pts = [('王', 4, 3, BLUE), ('女王', 1, 3, BLUE), ('男', 4, 1, ORANGE), ('女', 1, 1, ORANGE)]
    for label, px, py, color in pts:
        ax.plot(px, py, 'o', color=color, markersize=8, zorder=3)
        ax.annotate(f'{label} ({px}, {py})', (px, py), textcoords='offset points', xytext=(8, 4), fontsize=11, color=color)
    arrow(ax, (4, 1), (4, 3), GREEN)
    arrow(ax, (1, 1), (1, 3), GREEN)
    ax.annotate('王 − 男 = (0, 2)', (4.12, 1.95), fontsize=10, color=GREEN)
    ax.annotate('女王 − 女 = (0, 2)', (0.05, 1.95), fontsize=10, color=GREEN, ha='left')
    ax.annotate('同じ移動 =「王族化」', (2.5, 2.15), fontsize=10, color=GREEN, ha='center')
    ax.set_xlabel('第1成分(たとえば「男性らしさ」)')
    ax.set_ylabel('第2成分(たとえば「王族らしさ」)')
    ax.set_title('意味の関係が「平行な矢印」として現れる', fontsize=11)
    ax.set_xlim(-0.8, 5.8); ax.set_ylim(0.2, 3.8)
    ax.grid(alpha=0.25)
    save(fig, 'ch06-king-queen.png')


if __name__ == '__main__':
    ch02_dot_product_patterns()
    ch02_word_vectors()
    ch02_norm()
    ch02_rotation()
    ch03_gradient_contour()
    ch03_distribution_shapes()
    ch04_rent_fit()
    ch04_overfitting()
    ch06_embedding_space()
    ch06_king_queen()
