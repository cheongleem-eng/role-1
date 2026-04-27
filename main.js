/* ============================================================
   Pattern Lock Component — main.js (iOS Optimized)
   ============================================================ */

class PatternLock {
  constructor(containerId, onUnlock) {
    this.container = document.getElementById(containerId);
    this.onUnlock = onUnlock;
    this.dots = [];
    this.path = [];
    this.isDrawing = false;
    this.correctPattern = "412369";
    
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
    
    // 강제로 터치 액션 제한
    this.grid.style.touchAction = 'none';
    
    this.addEventListeners();
  }

  addEventListeners() {
    const start = (e) => {
      // 아이폰에서 이벤트 전파 방지 및 기본 동작 차단
      if (e.cancelable) e.preventDefault();
      this.isDrawing = true;
      this.path = [];
      this.clearStatus();
      this.handleMove(e);
    };

    const move = (e) => {
      if (!this.isDrawing) return;
      if (e.cancelable) e.preventDefault(); // 스크롤 방지
      this.handleMove(e);
    };

    const end = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.checkPattern();
    };

    // Mouse Events
    this.grid.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    // Touch Events (iOS 전용 설정 추가)
    this.grid.addEventListener('touchstart', start, { passive: false });
    this.grid.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end, { passive: false });
  }

  handleMove(e) {
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const targetDot = this.getDotAt(clientX, clientY);
    if (targetDot && !this.path.includes(targetDot)) {
      this.path.push(targetDot);
      this.dotElements[targetDot - 1].classList.add('active');
      
      // 진동 피드백 (지원되는 기기에서)
      if (navigator.vibrate) navigator.vibrate(10);
    }
    
    this.renderLines(clientX, clientY);
  }

  getDotAt(x, y) {
    for (let i = 0; i < this.dotElements.length; i++) {
      const rect = this.dotElements[i].getBoundingClientRect();
      const dotX = rect.left + rect.width / 2;
      const dotY = rect.top + rect.height / 2;
      
      // 거리 계산 (아이폰 터치 오차 고려하여 범위 확대)
      const distance = Math.hypot(x - dotX, y - dotY);
      
      if (distance < 35) { 
        return i + 1;
      }
    }
    return null;
  }

  renderLines(currentX, currentY) {
    let svgHtml = '';
    const rect = this.svg.getBoundingClientRect();

    for (let i = 0; i < this.path.length; i++) {
      const dotRect = this.dotElements[this.path[i] - 1].getBoundingClientRect();
      const x1 = dotRect.left - rect.left + dotRect.width / 2;
      const y1 = dotRect.top - rect.top + dotRect.height / 2;

      if (i < this.path.length - 1) {
        const nextDotRect = this.dotElements[this.path[i + 1] - 1].getBoundingClientRect();
        const x2 = nextDotRect.left - rect.left + nextDotRect.width / 2;
        const y2 = nextDotRect.top - rect.top + nextDotRect.height / 2;
        svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="pattern-line" />`;
      } else if (this.isDrawing) {
        const x2 = currentX - rect.left;
        const y2 = currentY - rect.top;
        svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="pattern-line active" />`;
      }
    }
    this.svg.innerHTML = svgHtml;
  }

  checkPattern() {
    const userPattern = this.path.join('');
    if (userPattern === this.correctPattern) {
      this.grid.classList.add('success');
      setTimeout(() => this.onUnlock(), 300);
    } else {
      if (this.path.length > 0) {
        this.grid.classList.add('error');
        // 실패 시 진동
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setTimeout(() => this.clearStatus(), 1000);
      }
    }
  }

  clearStatus() {
    this.path = [];
    this.isDrawing = false;
    this.grid.classList.remove('error', 'success');
    this.dotElements.forEach(dot => dot.classList.remove('active'));
    this.svg.innerHTML = '';
  }
}

// Initialize Pattern Lock
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pattern-container');
  if (container) {
    new PatternLock('pattern-container', () => {
      const lockScreen = document.getElementById('screen-lock');
      const portalScreen = document.getElementById('screen-portal');
      if (lockScreen) lockScreen.classList.remove('active');
      if (portalScreen) portalScreen.classList.add('active');
    });
  }
});
