const canvas = document.getElementById('poolCanvas');
const ctx = canvas.getContext('2d');
const angleRange = document.getElementById('angleRange');
const angleValue = document.getElementById('angleValue');
const powerRange = document.getElementById('powerRange');
const powerValue = document.getElementById('powerValue');


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

powerRange.addEventListener('input', () => {
    powerValue.textContent = powerRange.value;
});
function getRandomPosition(radius) {
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = Math.random() * (canvas.height - 2 * radius) + radius;
    return { x, y };
}

function addBall(count = 1) {

    const colors = ['black'];

    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < count; i++) {
        let { x, y } = getRandomPosition(10);
        balls.push(new Ball(x, y, 10, color));
    }
}

function removeBall(count = 1) {
    const nonCueBalls = balls.filter(b => !b.isCue);

    if (nonCueBalls.length === 0) return;

    // Shuffle and take the first `count` balls
    const shuffled = nonCueBalls.sort(() => 0.5 - Math.random());
    const ballsToRemove = shuffled.slice(0, Math.min(count, nonCueBalls.length));

    ballsToRemove.forEach(ball => {
        const idx = balls.indexOf(ball);
        if (idx !== -1) balls.splice(idx, 1);
    });
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
];

angleRange.addEventListener('input', () => {
    angleValue.textContent = angleRange.value;
});

function shootCueBall() {
    const cue = balls.find(b => b.isCue);
    const angleDeg = parseInt(angleRange.value);
    const angleRad = angleDeg * (Math.PI / 180);
    const power = parseInt(powerRange.value);
    cue.vx = power * Math.cos(angleRad);
    cue.vy = power * Math.sin(angleRad);
}

function drawTrajectory(cue) {
    const angleDeg = parseInt(angleRange.value);
    const angleRad = angleDeg * (Math.PI / 180);
    const power = parseInt(powerRange.value);

    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);
    const startX = cue.x;
    const startY = cue.y;
    const radius = cue.radius;

    let minT = Infinity;
    let collisionPoint = null;
    let collisionType = null;
    let hitBall = null;

    // Check wall collision
    const walls = [
        { t: (radius - startX) / dx, wall: 'vertical' },
        { t: (canvas.width - radius - startX) / dx, wall: 'vertical' },
        { t: (radius - startY) / dy, wall: 'horizontal' },
        { t: (canvas.height - radius - startY) / dy, wall: 'horizontal' }
    ];

    for (const wall of walls) {
        if (wall.t > 0 && wall.t < minT) {
            minT = wall.t;
            collisionPoint = {
                x: startX + dx * wall.t,
                y: startY + dy * wall.t
            };
            collisionType = 'wall';
        }
    }

    // Check ball collisions
    for (const ball of balls) {
        if (ball.isCue) continue;

        const px = ball.x - startX;
        const py = ball.y - startY;

        const a = dx * dx + dy * dy;
        const b = -2 * (px * dx + py * dy);
        const c = px * px + py * py - Math.pow(ball.radius + cue.radius, 2);
        const discriminant = b * b - 4 * a * c;

        if (discriminant >= 0) {
            const sqrtD = Math.sqrt(discriminant);
            const t1 = (-b - sqrtD) / (2 * a);
            const t2 = (-b + sqrtD) / (2 * a);

            const tHit = t1 > 0 ? t1 : t2 > 0 ? t2 : null;

            if (tHit && tHit < minT) {
                minT = tHit;
                collisionPoint = {
                    x: startX + dx * tHit,
                    y: startY + dy * tHit
                };
                collisionType = 'ball';
                hitBall = ball;
            }
        }
    }

    // Draw initial trajectory
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(startX, startY);
    ctx.lineTo(collisionPoint.x, collisionPoint.y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // BALL HIT CASE
    if (collisionType === 'ball') {
        // Draw red circle at collision point
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.arc(collisionPoint.x, collisionPoint.y, hitBall.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Compute vector from cue to hit ball (impact line)
        const nx = hitBall.x - collisionPoint.x;
        const ny = hitBall.y - collisionPoint.y;
        const length = Math.sqrt(nx * nx + ny * ny);
        const normalX = nx / length;
        const normalY = ny / length;

        // Target ball direction = along the normal
        const impactLineX = normalX;
        const impactLineY = normalY;

        // Cue ricochet = incoming vector - 2 * projection onto normal
        const dot = dx * normalX + dy * normalY;
        const ricochetX = dx - 2 * dot * normalX;
        const ricochetY = dy - 2 * dot * normalY;

        // Draw cue ball ricochet line (blue)
        ctx.beginPath();
        ctx.moveTo(collisionPoint.x, collisionPoint.y);
        ctx.lineTo(collisionPoint.x + ricochetX * 60, collisionPoint.y + ricochetY * 60);
        ctx.strokeStyle = 'blue';
        ctx.setLineDash([]);
        ctx.stroke();

        // Draw hit ball direction line (orange)
        ctx.beginPath();
        ctx.moveTo(hitBall.x, hitBall.y);
        ctx.lineTo(hitBall.x + impactLineX * 40, hitBall.y + impactLineY * 40);
        ctx.strokeStyle = 'orange';
        ctx.stroke();
    }

    // WALL RICOCHET CASE
    if (collisionType === 'wall') {
        let reflDx = dx;
        let reflDy = dy;
        const wall = walls.find(w => w.t === minT).wall;
        if (wall === 'vertical') reflDx *= -1;
        if (wall === 'horizontal') reflDy *= -1;

        const ricochetLength = 100;
        const endX = collisionPoint.x + reflDx * ricochetLength;
        const endY = collisionPoint.y + reflDy * ricochetLength;

        ctx.beginPath();
        ctx.moveTo(collisionPoint.x, collisionPoint.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'red';
        ctx.setLineDash([]);
        ctx.stroke();
    }
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


angleRange.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevent page scrolling

    const delta = Math.sign(e.deltaY);
    const step = parseInt(angleRange.step) || 1;

    // Scroll up = decrease value, scroll down = increase
    if (delta > 0) {
        angleRange.value = Math.min(parseInt(angleRange.value) + step, angleRange.max);
    } else {
        angleRange.value = Math.max(parseInt(angleRange.value) - step, angleRange.min);
    }

    // Update the UI or trigger any dependent behavior
    angleValue.textContent = `${angleRange.value}°`;

    // Optionally: trigger your drawTrajectory() function here
    drawTrajectory(cueBall);
});

animate();