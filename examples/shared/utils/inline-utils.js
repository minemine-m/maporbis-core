/**
 * 通知函数 - 显示 toast 消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型: 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration - 显示时长(ms)
 */
function notify(message, type = 'info', duration = 3000) {
  // 移除已存在的通知
  const existing = document.querySelector('.orbis-toast');
  if (existing) existing.remove();

  // 创建 toast 元素
  const toast = document.createElement('div');
  toast.className = `orbis-toast orbis-toast-${type}`;

  // 图标映射
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  // 添加样式
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'fadeInDown 0.3s ease'
  });

  document.body.appendChild(toast);

  // 自动移除
  setTimeout(() => {
    toast.style.animation = 'fadeOutUp 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes fadeOutUp {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// 导出到全局
window.notify = notify;
