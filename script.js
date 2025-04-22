const canvas = document.getElementById('poolCanvas');
const ctx = canvas.getContext('2d');
const angleRange = document.getElementById('angleRange');
const angleValue = document.getElementById('angleValue');

class Ball {
    constructor(x, y, radius, color, isCue = false) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.color = color;
        this.isCue = isCue;
        this.mass = 1;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.99;
        this.vy *= 0.99;

        if (Math.abs(this.vx) < 0.05) this.vx = 0;
        if (Math.abs(this.vy) < 0.05) this.vy = 0;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(this.x, canvas.width - this.radius));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(this.y, canvas.height - this.radius));
        }
    }
}

function detectCollision(ballA, ballB) {
    const dx = ballB.x - ballA.x;
    const dy = ballB.y - ballA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ballA.radius + ballB.radius) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        const vA = rotate(ballA.vx, ballA.vy, sin, cos, true);
        const vB = rotate(ballB.vx, ballB.vy, sin, cos, true);

        const vxTotal = vA.x - vB.x;
        vA.x = ((ballA.mass - ballB.mass) * vA.x + 2 * ballB.mass * vB.x) / (ballA.mass + ballB.mass);
        vB.x = vxTotal + vA.x;

        const finalVA = rotate(vA.x, vA.y, sin, cos, false);
        const finalVB = rotate(vB.x, vB.y, sin, cos, false);

        ballA.vx = finalVA.x;
        ballA.vy = finalVA.y;
        ballB.vx = finalVB.x;
        ballB.vy = finalVB.y;

        const overlap = 0.5 * (ballA.radius + ballB.radius - dist + 1);
        ballA.x -= overlap * Math.cos(angle);
        ballA.y -= overlap * Math.sin(angle);
        ballB.x += overlap * Math.cos(angle);
        ballB.y += overlap * Math.sin(angle);
    }
}

function rotate(vx, vy, sin, cos, reverse) {
    return reverse
        ? { x: vx * cos + vy * sin, y: vy * cos - vx * sin }
        : { x: vx * cos - vy * sin, y: vy * cos + vx * sin };
}

const balls = [
    new Ball(100, 200, 10, 'white', true),
    new Ball(500, 200, 10, 'red'),
    new Ball(520, 190, 10, 'yellow'),
    new Ball(520, 210, 10, 'blue'),
];

angleRange.addEventListener('input', () => {
    angleValue.textContent = angleRange.value;
});

function shootCueBall() {
    const cue = balls.find(b => b.isCue);
    const angleDeg = parseInt(angleRange.value);
    const angleRad = angleDeg * (Math.PI / 180);
    const power = 10;
    cue.vx = power * Math.cos(angleRad);
    cue.vy = power * Math.sin(angleRad);
}

function drawTrajectory(cue) {
    const angleDeg = parseInt(angleRange.value);
    const angleRad = angleDeg * (Math.PI / 180);
    const power = 10;
    const tx = cue.x + Math.cos(angleRad) * power * 25;
    const ty = cue.y + Math.sin(angleRad) * power * 25;

    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    balls.forEach(ball => {
        ball.update();
        ball.draw();
    });

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            detectCollision(balls[i], balls[j]);
        }
    }

    const cue = balls.find(b => b.isCue);
    if (cue.vx === 0 && cue.vy === 0) {
        drawTrajectory(cue);
    }

    requestAnimationFrame(animate);
}

animate();