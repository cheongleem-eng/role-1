/* ============================================================
   Pattern Lock Component — main.js (Global Touch Strategy)
   ============================================================ */

class PatternLock {
  constructor(containerId, onUnlock) {
    this.container = document.getElementById(containerId);
    this.onUnlock = onUnlock;
    this.dots = [];
    this.path = [];
    this.isDrawing = false;
    this.correctPattern = "412369";
    this.dotCenters = []; 
    
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="pattern-grid">
        ${Array.from({ length: 9 }, (_, i) => `<div class="dot" data-index="${i + 1}"></div>`).join('')}
        <svg class="pattern-svg"></svg>
      </div>
    `;
    
    this.grid = this.container.querySelector('.pattern-grid');
    this.svg = this.container.querySelector('.pattern-svg');
    this.dotElements = this.container.querySelectorAll('.dot');
    
    // 강제 스타일 고정
    this.grid.style.touchAction = 'none';
    this.grid.style.userSelect = 'none';
    
    this.addEventListeners();
  }

  cacheDotPositions() {
    this.dotCenters = [];
    this.dotElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      this.dotCenters.push({
        index: index + 1,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    });
  }

  addEventListeners() {
    const handleStart = (e) => {
      if (e.cancelable) e.preventDefault();
      
      this.isDrawing = true;
      this.path = [];
      this.clearStatus();
      this.cacheDotPositions();
      
      const point = this.getEventPoint(e);
      this.handleMoveAt(point.x, point.y);
    };

    const handleMove = (e) => {
      if (!this.isDrawing) return;
      if (e.cancelable) e.preventDefault();
      
      const point = this.getEventPoint(e);
      this.handleMoveAt(point.x, point.y);
    };

    const handleEnd = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.checkPattern();
    };

    // 시작은 격자 내부에서만
    this.grid.addEventListener('touchstart', handleStart, { passive: false });
    this.grid.addEventListener('mousedown', handleStart);

    // 이동과 종료는 윈도우 전역에서 리슨 (격자 밖으로 나가도 드래그 유지)
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
  }

  getEventPoint(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  handleMoveAt(x, y) {
    const targetDot = this.findNearestDot(x, y);
    
    if (targetDot && !this.path.includes(targetDot)) {
      this.path.push(targetDot);
      this.dotElements[targetDot - 1].classList.add('active');
      if (navigator.vibrate) navigator.vibrate(20);
    }
    
    this.renderLines(x, y);
  }

  findNearestDot(x, y) {
    for (const dot of this.dotCenters) {
      const dist = Math.hypot(x - dot.x, y - dot.y);
      if (dist < 40) { // 인식 범위 대폭 확보
        return dot.index;
      }
    }
    return null;
  }

  renderLines(currentX, currentY) {
    if (this.path.length === 0) return;

    let svgHtml = '';
    const svgRect = this.svg.getBoundingClientRect();

    for (let i = 0; i < this.path.length; i++) {
      const dotIdx = this.path[i];
      const center = this.dotCenters[dotIdx - 1];
      
      const x1 = center.x - svgRect.left;
      const y1 = center.y - svgRect.top;

      if (i < this.path.length - 1) {
        const nextDotIdx = this.path[i + 1];
        const nextCenter = this.dotCenters[nextDotIdx - 1];
        const x2 = nextCenter.x - svgRect.left;
        const y2 = nextCenter.y - svgRect.top;
        svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="pattern-line" />`;
      } else if (this.isDrawing) {
        const x2 = currentX - svgRect.left;
        const y2 = currentY - svgRect.top;
        svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="pattern-line active" />`;
      }
    }
    this.svg.innerHTML = svgHtml;
  }

  checkPattern() {
    const userPattern = this.path.join('');
    if (userPattern === this.correctPattern) {
      this.grid.classList.add('success');
      setTimeout(() => this.unlock(), 300);
    } else {
      if (this.path.length > 0) {
        this.grid.classList.add('error');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setTimeout(() => this.clearStatus(), 1000);
      }
    }
  }

  unlock() {
    document.body.classList.remove('lock-active');
    document.getElementById('screen-lock').style.display = 'none';
    document.getElementById('screen-portal').classList.add('active');
  }

  clearStatus() {
    this.path = [];
    this.isDrawing = false;
    this.grid.classList.remove('error', 'success');
    this.dotElements.forEach(dot => dot.classList.remove('active'));
    this.svg.innerHTML = '';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pattern-container');
  if (container) new PatternLock('pattern-container');
});
