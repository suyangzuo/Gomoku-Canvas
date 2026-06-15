class 五子棋 {
  constructor() {
    this.画布 = document.getElementById("游戏画布");
    this.上下文 = this.画布.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;
    this.画布.width = this.画布.offsetWidth * this.dpr;
    this.画布.height = this.画布.offsetHeight * this.dpr;
    this.上下文.scale(this.dpr, this.dpr);
    this.边界矩形 = this.画布.getBoundingClientRect();
    this.鼠标坐标 = {
      x: null,
      y: null,
    };
    this.棋子图 = new Image();
    this.棋子图.src = "./Images/黑白棋子.webp";
    this.棋子图.onload = () => {
      this.刷新棋盘数据();
      this.添加观察器();
      this.绑定事件();
      this.棋子图像宽度 = this.棋子图.naturalWidth;
      this.棋子图像高度 = this.棋子图.naturalHeight;
      this.黑子范围 = {
        x: 0,
        y: 0,
      };
      this.白子范围 = {
        x: this.棋子图像宽度 / 2,
        y: 0,
      };
    };
    this.颜色集 = {
      经纬线描边色: "#888",
      索引颜色: "#ccc",
      预览落子描边色: "#871",
      预览棋盘格十字色: "#5af",
      悬停索引背景圆填充色: "silver",
      悬停索引文本填充色: "black",
    };
    this.棋子精灵图范围 = {
      黑: {
        x: 0,
        y: 0,
        width: 365,
        height: 365,
      },
      白: {
        x: 365,
        y: 0,
        width: 730,
        height: 365,
      },
    };
    this.悬停索引背景圆半径 = 22;
    this.索引与棋盘距离 = 80;
    this.棋盘索引字体 = `${14 * this.dpr}px 'Google Sans Code', Consolas, 'Noto Sans SC', 微软雅黑, sans-serif`;
    this.棋盘悬停索引字体 = `550 ${14 * this.dpr}px 'Google Sans Code', Consolas, 'Noto Sans SC', 微软雅黑, sans-serif`;
    this.游玩中 = false;
    this.当前落子色 = "黑";
    this.当前悬停格索引 = {
      行: null,
      列: null,
    };
    this.前悬停格索引 = {
      行: null,
      列: null,
    };
    this.经纬线数量 = 19;
    this.棋盘内边距 = 120;
    this.经纬线坐标 = [];
    this.棋盘格数据 = [];
    this.对弈记录 = [];
    this.防抖计时器 = null;
  }

  清空画布() {
    this.上下文.clearRect(0, 0, this.画布.width, this.画布.height);
  }

  添加观察器() {
    const 回调 = () => {
      clearTimeout(this.防抖计时器);
      this.防抖计时器 = setTimeout(() => {
        this.画布.width = this.画布.offsetWidth * this.dpr;
        this.画布.height = this.画布.offsetHeight * this.dpr;
        this.刷新边界矩形();
        this.刷新棋盘数据();
        if (this.游玩中) {
          for (const [index, 记录] of this.对弈记录.entries()) {
            this.绘制棋子({
              行: 记录.行,
              列: 记录.列,
            });
            this.绘制棋子序号(
              {
                行: 记录.行,
                列: 记录.列,
              },
              index + 1,
            );
          }
        }
      }, 50);
    };
    this.视口尺寸观察器 = new ResizeObserver(回调);
    this.视口尺寸观察器.observe(document.body);
  }

  绑定事件() {
    this.画布.addEventListener("mousemove", (e) => {
      this.获取鼠标坐标(e);
      if (
        this.鼠标坐标.x < this.棋盘内边距 - this.棋盘格宽度 / 2 ||
        this.鼠标坐标.y < this.棋盘内边距 - this.棋盘格宽度 / 2 ||
        this.鼠标坐标.x > this.画布.width - (this.棋盘内边距 - this.棋盘格宽度 / 2) ||
        this.鼠标坐标.y > this.画布.height - (this.棋盘内边距 - this.棋盘格宽度 / 2)
      ) {
        this.当前悬停格索引.行 = null;
        this.当前悬停格索引.列 = null;
        this.移除预览效果(this.前悬停格索引);
        this.前悬停格索引.行 = null;
        this.前悬停格索引.列 = null;
        return;
      }
      for (let i = 0; i < this.棋盘格数据.length; i++) {
        if (this.鼠标位于悬停格内(this.棋盘格数据[i].坐标)) {
          if (
            this.前悬停格索引.行 !== this.棋盘格数据[i].索引.行 ||
            this.前悬停格索引.列 !== this.棋盘格数据[i].索引.列
          ) {
            this.移除预览效果(this.前悬停格索引);
            this.绘制悬停预览效果(this.棋盘格数据[i].索引);
            this.前悬停格索引.行 = this.棋盘格数据[i].索引.行;
            this.前悬停格索引.列 = this.棋盘格数据[i].索引.列;
            this.当前悬停格索引.行 = this.棋盘格数据[i].索引.行;
            this.当前悬停格索引.列 = this.棋盘格数据[i].索引.列;
          }
        }
      }
    });

    this.画布.addEventListener("mousedown", () => {
      const 落子索引 = this.从行列获取棋盘格索引(this.当前悬停格索引);
      if (!this.游玩中 || this.棋盘格数据[落子索引].落子) return;

      this.棋盘格数据[落子索引].落子 = this.当前落子色;
      this.绘制棋子(this.当前悬停格索引);
      this.当前落子色 = this.当前落子色 === "黑" ? "白" : "黑";
      this.保存对弈记录(this.当前悬停格索引);
      this.绘制棋子序号(this.当前悬停格索引, this.对弈记录.length);
    });

    window.addEventListener("scroll", () => {
      this.刷新边界矩形();
      this.绘制棋盘();
    });
  }

  获取鼠标坐标(e) {
    this.鼠标坐标.x = (e.clientX - this.边界矩形.left) * this.dpr;
    this.鼠标坐标.y = (e.clientY - this.边界矩形.top) * this.dpr;
    // console.log(this.鼠标坐标);
  }

  刷新边界矩形() {
    this.边界矩形 = this.画布.getBoundingClientRect();
  }

  从行列获取棋盘格索引(行列索引) {
    return 行列索引.行 * this.经纬线数量 + 行列索引.列;
  }

  鼠标位于悬停格内(悬停格坐标) {
    return (
      this.鼠标坐标.x >= 悬停格坐标.x - this.棋盘格宽度 / 2 &&
      this.鼠标坐标.x <= 悬停格坐标.x + this.棋盘格宽度 / 2 &&
      this.鼠标坐标.y >= 悬停格坐标.y - this.棋盘格宽度 / 2 &&
      this.鼠标坐标.y <= 悬停格坐标.y + this.棋盘格宽度 / 2
    );
  }

  刷新棋盘数据() {
    this.棋盘格宽度 = (this.画布.width - this.棋盘内边距 * 2) / (this.经纬线数量 - 1);
    this.棋子半径 = this.棋盘格宽度 / 2 - 8;
    this.清空画布();
    this.生成经纬线坐标();
    this.绘制棋盘();
    this.生成棋盘格数据();
  }

  重置棋盘状态() {
    this.游玩中 = false;
    this.当前落子色 = "黑";
    this.对弈记录 = [];
  }

  生成经纬线坐标() {
    this.经纬线坐标 = [];
    for (let i = 0; i < this.经纬线数量; i++) {
      this.经纬线坐标.push(this.棋盘内边距 + i * this.棋盘格宽度);
    }
  }

  生成棋盘格数据() {
    if (!this.游玩中) {
      this.棋盘格数据 = [];
    }
    for (let 行 = 0; 行 < this.经纬线数量; 行++) {
      for (let 列 = 0; 列 < this.经纬线数量; 列++) {
        const 当前格索引 = this.从行列获取棋盘格索引({ 行: 行, 列: 列 });
        if (this.游玩中) {
          this.棋盘格数据[当前格索引].坐标.x = this.经纬线坐标[列];
          this.棋盘格数据[当前格索引].坐标.y = this.经纬线坐标[行];
        } else {
          this.棋盘格数据.push({
            索引: {
              行: 行,
              列: 列,
            },
            坐标: {
              x: this.经纬线坐标[列],
              y: this.经纬线坐标[行],
            },
            落子: null,
          });
        }
      }
    }
  }

  绘制棋盘() {
    this.绘制经纬线();
    this.绘制经纬线索引();
  }

  绘制经纬线() {
    this.上下文.save();
    this.上下文.strokeStyle = this.颜色集["经纬线描边色"];
    for (let i = 0; i < this.经纬线数量; i++) {
      this.上下文.beginPath();
      this.上下文.moveTo(this.棋盘内边距, this.经纬线坐标[i]);
      this.上下文.lineTo(this.经纬线坐标.at(-1), this.经纬线坐标[i]);
      this.上下文.stroke();

      this.上下文.beginPath();
      this.上下文.moveTo(this.经纬线坐标[i], this.棋盘内边距);
      this.上下文.lineTo(this.经纬线坐标[i], this.经纬线坐标.at(-1));
      this.上下文.stroke();
    }
    this.上下文.restore();
  }

  绘制经纬线索引() {
    this.上下文.save();
    this.上下文.fillStyle = this.颜色集["索引颜色"];
    this.上下文.font = this.棋盘索引字体;
    this.上下文.textAlign = "center";
    this.上下文.textBaseline = "middle";

    for (let i = 0; i < this.经纬线数量; i++) {
      this.上下文.fillText(i + 1, this.经纬线坐标[i], this.棋盘内边距 - this.索引与棋盘距离);
      this.上下文.fillText(i + 1, this.棋盘内边距 - this.索引与棋盘距离, this.经纬线坐标[i]);
    }

    this.上下文.restore();
  }

  绘制悬停预览效果(悬停格索引) {
    this.绘制悬停落子预览(悬停格索引);
    this.绘制悬停索引(悬停格索引);
  }

  绘制悬停落子预览(悬停格索引) {
    const 落子索引 = this.从行列获取棋盘格索引(悬停格索引);
    if (this.棋盘格数据[落子索引].落子) return;
    this.上下文.save();

    this.上下文.strokeStyle = this.颜色集["预览棋盘格十字色"];
    this.上下文.lineWidth = 4;
    const 十字内缩 = this.上下文.lineWidth / 2;
    this.上下文.beginPath();
    this.上下文.moveTo(
      this.经纬线坐标[悬停格索引.列],
      this.经纬线坐标[悬停格索引.行] - (悬停格索引.行 === 0 ? 十字内缩 : this.棋子半径 - 4),
    );
    this.上下文.lineTo(
      this.经纬线坐标[悬停格索引.列],
      this.经纬线坐标[悬停格索引.行] + (悬停格索引.行 === this.经纬线数量 - 1 ? 十字内缩 : this.棋子半径 - 4),
    );
    this.上下文.stroke();
    this.上下文.beginPath();
    this.上下文.moveTo(
      this.经纬线坐标[悬停格索引.列] - (悬停格索引.列 === 0 ? 十字内缩 : this.棋子半径 - 4),
      this.经纬线坐标[悬停格索引.行],
    );
    this.上下文.lineTo(
      this.经纬线坐标[悬停格索引.列] + (悬停格索引.列 === this.经纬线数量 - 1 ? 十字内缩 : this.棋子半径 - 4),
      this.经纬线坐标[悬停格索引.行],
    );
    this.上下文.stroke();

    /* this.上下文.strokeStyle = this.颜色集["预览落子描边色"];
    this.上下文.beginPath();
    this.上下文.arc(this.经纬线坐标[悬停格索引.列], this.经纬线坐标[悬停格索引.行], this.棋子半径 - 4, 0, Math.PI * 2);
    this.上下文.closePath();
    this.上下文.lineWidth = 1;
    this.上下文.stroke(); */

    this.上下文.restore();
  }

  绘制悬停索引(悬停格索引) {
    this.上下文.save();

    this.上下文.fillStyle = this.颜色集["悬停索引背景圆填充色"];
    this.上下文.beginPath();
    this.上下文.arc(
      this.经纬线坐标[悬停格索引.列],
      this.棋盘内边距 - this.索引与棋盘距离,
      this.悬停索引背景圆半径,
      0,
      Math.PI * 2,
    );
    this.上下文.closePath();
    this.上下文.fill();
    this.上下文.beginPath();
    this.上下文.arc(
      this.棋盘内边距 - this.索引与棋盘距离,
      this.经纬线坐标[悬停格索引.行],
      this.悬停索引背景圆半径,
      0,
      Math.PI * 2,
    );
    this.上下文.closePath();
    this.上下文.fill();
    this.上下文.font = this.棋盘悬停索引字体;
    this.上下文.textAlign = "center";
    this.上下文.textBaseline = "middle";
    this.上下文.fillStyle = this.颜色集["悬停索引文本填充色"];
    this.上下文.fillText(悬停格索引.列 + 1, this.经纬线坐标[悬停格索引.列], this.棋盘内边距 - this.索引与棋盘距离);
    this.上下文.fillText(悬停格索引.行 + 1, this.棋盘内边距 - this.索引与棋盘距离, this.经纬线坐标[悬停格索引.行]);

    this.上下文.restore();
  }

  移除预览效果(悬停格索引) {
    this.移除悬停格预览(悬停格索引);
    this.移除悬停索引预览(悬停格索引);
  }

  移除悬停格预览(悬停格索引) {
    this.上下文.save();
    const 前落子索引 = this.从行列获取棋盘格索引(this.当前悬停格索引);
    if (this.棋盘格数据[前落子索引].落子) return;

    this.上下文.clearRect(
      this.经纬线坐标[悬停格索引.列] - this.棋子半径 - 1,
      this.经纬线坐标[悬停格索引.行] - this.棋子半径 - 1,
      this.棋子半径 * 2 + 2,
      this.棋子半径 * 2 + 2,
    );
    this.上下文.strokeStyle = this.颜色集["经纬线描边色"];
    this.上下文.beginPath();
    this.上下文.moveTo(
      this.经纬线坐标[悬停格索引.列] - (悬停格索引.列 === 0 ? 0 : this.棋子半径 + 1),
      this.经纬线坐标[悬停格索引.行],
    );
    this.上下文.lineTo(
      this.经纬线坐标[悬停格索引.列] + (悬停格索引.列 === this.经纬线坐标.length - 1 ? 0 : this.棋子半径 + 1),
      this.经纬线坐标[悬停格索引.行],
    );
    this.上下文.moveTo(
      this.经纬线坐标[悬停格索引.列],
      this.经纬线坐标[悬停格索引.行] - (悬停格索引.行 === 0 ? 0 : this.棋子半径 + 1),
    );
    this.上下文.lineTo(
      this.经纬线坐标[悬停格索引.列],
      this.经纬线坐标[悬停格索引.行] + (悬停格索引.行 === this.经纬线坐标.length - 1 ? 0 : this.棋子半径 + 1),
    );
    this.上下文.stroke();
    this.上下文.restore();
  }

  移除悬停索引预览(悬停格索引) {
    this.上下文.save();
    const 擦除溢出半径 = 2;
    this.上下文.clearRect(
      this.经纬线坐标[悬停格索引.列] - this.悬停索引背景圆半径 - 擦除溢出半径,
      this.棋盘内边距 - this.索引与棋盘距离 - this.悬停索引背景圆半径 - 擦除溢出半径,
      this.悬停索引背景圆半径 * 2 + 擦除溢出半径 * 2,
      this.悬停索引背景圆半径 * 2 + 擦除溢出半径 * 2,
    );
    this.上下文.clearRect(
      this.棋盘内边距 - this.索引与棋盘距离 - this.悬停索引背景圆半径 - 擦除溢出半径,
      this.经纬线坐标[悬停格索引.行] - this.悬停索引背景圆半径 - 擦除溢出半径,
      this.悬停索引背景圆半径 * 2 + 擦除溢出半径 * 2,
      this.悬停索引背景圆半径 * 2 + 擦除溢出半径 * 2,
    );
    this.上下文.fillStyle = this.颜色集["索引颜色"];
    this.上下文.font = this.棋盘索引字体;
    this.上下文.textAlign = "center";
    this.上下文.textBaseline = "middle";
    this.上下文.fillText(
      this.前悬停格索引.列 + 1,
      this.经纬线坐标[this.前悬停格索引.列],
      this.棋盘内边距 - this.索引与棋盘距离,
    );
    this.上下文.fillText(
      this.前悬停格索引.行 + 1,
      this.棋盘内边距 - this.索引与棋盘距离,
      this.经纬线坐标[this.前悬停格索引.行],
    );
    this.上下文.restore();
  }

  绘制棋子(悬停格索引) {
    this.上下文.save();
    const 坐标 = {
      行: this.经纬线坐标[悬停格索引.行],
      列: this.经纬线坐标[悬停格索引.列],
    };
    const 落子索引 = this.从行列获取棋盘格索引(悬停格索引);
    /* this.上下文.drawImage(
      this.棋子图,
      this.棋盘格数据[落子索引].落子 === "黑" ? this.黑子范围.x : this.白子范围.x,
      this.棋盘格数据[落子索引].落子 === "黑" ? this.黑子范围.y : this.白子范围.y,
      this.棋子图像宽度 / 2,
      this.棋子图像高度,
      坐标.列 - this.棋子半径,
      坐标.行 - this.棋子半径,
      this.棋子半径 * 2,
      this.棋子半径 * 2,
    ); */
    this.上下文.fillStyle = this.棋盘格数据[落子索引].落子 === "黑" ? "#000" : "#fff";
    this.上下文.beginPath();
    this.上下文.arc(坐标.列, 坐标.行, this.棋子半径, 0, Math.PI * 2);
    this.上下文.closePath();
    this.上下文.fill();
    this.上下文.restore();
  }

  绘制棋子序号(行列索引, 序号) {
    this.上下文.save();
    this.上下文.font = `${14 * this.dpr}px 'Google Sans Code', 'Consolas', monospace`;
    this.上下文.textAlign = "center";
    this.上下文.textBaseline = "middle";
    const 落子索引 = this.从行列获取棋盘格索引(行列索引);
    const x = this.经纬线坐标[行列索引.列];
    const y = this.经纬线坐标[行列索引.行];
    this.上下文.fillStyle = this.棋盘格数据[落子索引].落子 === "黑" ? "#fff" : "#000";
    this.上下文.fillText(序号, x, y);
    this.上下文.restore();
  }

  保存对弈记录(落子行列索引) {
    const 落子索引 = this.从行列获取棋盘格索引(落子行列索引);
    this.对弈记录.push({
      索引: 落子索引,
      行: 落子行列索引.行,
      列: 落子行列索引.列,
      颜色: this.棋盘格数据[落子索引].落子,
    });
  }

  判断胜负(落子行列索引) {
    const 落子索引 = this.从行列获取棋盘格索引(落子行列索引);
    const 落子颜色 = this.棋盘格数据[落子索引].落子;
  }
}

const 五子棋实例 = new 五子棋();

const 游玩按钮 = document.getElementById("游玩");
游玩按钮.addEventListener("click", () => {
  if (!五子棋实例.游玩中) {
    五子棋实例.重置棋盘状态();
    五子棋实例.刷新棋盘数据();
  }
  五子棋实例.游玩中 = !五子棋实例.游玩中;
  游玩按钮.textContent = 五子棋实例.游玩中 ? "停止" : "开始";
  游玩按钮.style.backgroundColor = 五子棋实例.游玩中 ? "#712" : "#174";
});
