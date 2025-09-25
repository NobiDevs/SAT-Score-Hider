function shootConfetti(x, y, options = {}) {
    const {
        particleCount = 30,
            spread = 100
    } = options;

    const isFirefox = navigator.userAgent.includes('Firefox');

    if (isFirefox) {

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '10001';
        canvas.style.pointerEvents = 'none';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * spread + 50;
            particles.push({
                x: x,
                y: y,
                transformX: Math.cos(angle) * distance,
                transformY: Math.sin(angle) * distance,
                rotation: Math.random() * 2 * Math.PI,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                life: 1
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.life -= 0.02;
                if (p.life > 0) {
                    const progress = 1 - p.life;
                    const currentX = p.x + p.transformX * progress;
                    const currentY = p.y + p.transformY * progress;
                    const currentRotation = p.rotation * progress;
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.save();
                    ctx.translate(currentX, currentY);
                    ctx.rotate(currentRotation);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });
            if (particles.some(p => p.life > 0)) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        }
        animate();
    } else {

        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];

        for (let i = 0; i < particleCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = `${x}px`;
            confetti.style.top = `${y}px`;
            confetti.style.width = `${Math.random() * 8 + 4}px`;
            confetti.style.height = `${Math.random() * 8 + 4}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.opacity = '1';
            confetti.style.zIndex = '10001';
            confetti.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
            confetti.style.pointerEvents = 'none';

            document.body.appendChild(confetti);

            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * spread + 50;

            const transformX = Math.cos(angle) * distance;
            const transformY = Math.sin(angle) * distance;
            const rotation = Math.random() * 360;

            requestAnimationFrame(() => {
                confetti.style.transform = `translate(${transformX}px, ${transformY}px) rotate(${rotation}deg)`;
                confetti.style.opacity = '0';
            });

            setTimeout(() => {
                confetti.remove();
            }, 1000);
        }
    }
}