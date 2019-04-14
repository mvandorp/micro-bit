enum InputMethod {
    Buttons,
    Acceleration
}

const UPDATE_INTERVAL = 500;
const SCREEN_WIDTH = 5;
const SCREEN_HEIGHT = 5;
const CONTROL_SCHEME = InputMethod.Acceleration as InputMethod;

// Represents a point in 2D space.
class Point {
    X: number;
    Y: number;

    // Constructs a new point with the given coordinates.
    constructor(x: number, y: number) {
        this.X = x;
        this.Y = y;
    }

    // Dethermine whether this point is equal to the given point.
    equals(p: Point) {
        return this.X == p.X && this.Y == p.Y;
    }

    // If the point is outside the screen, 'wraps' it around to the other side of the screen.
    wrapToScreen(width: number, height: number) {
        if (this.X < 0) {
            this.X = width - 1;
        }
        else if (this.X >= width) {
            this.X %= width;
        }

        if (this.Y < 0) {
            this.Y = height - 1;
        }
        else if (this.Y >= height) {
            this.Y %= height;
        }
    }
}

// Represents the 'food' the snake is chasing after.
class Food {
    Position: Point;

    // Constructs new food and positions it somewhere outside of the given snake.
    constructor(snake: Snake) {
        this.Position = new Point(0, 0);

        this.place(snake);
    }

    randomizePosition() {
        this.Position.X = Math.randomRange(0, SCREEN_WIDTH - 1);
        this.Position.Y = Math.randomRange(0, SCREEN_HEIGHT - 1);
    }

    draw() {
        led.plot(this.Position.X, this.Position.Y);
    }

    // Repositions the food at a random position outside of the given snake.
    place(snake: Snake) {
        // HACK: AWFUL algorithm!!! Non-determistic, can theoretically loop indefinitely.
        do {
            this.randomizePosition();

            // HACK: Just terminate if the snake fills the entire screen,
            // game will be over on the next update anyway.
            if (snake.getLength() == SCREEN_WIDTH * SCREEN_HEIGHT) break;
        }
        while (snake.containsPoint(this.Position));

        this.draw();
    }
}

// Represents the snake.
class Snake {
    Body: Array<Point>;
    Direction: Point;

    // Constructs a new snake at the given coordinates.
    // The snake will start move in the direction (1, 0).
    constructor(x: number, y: number) {
        this.Body = [new Point(x, y)];
        this.Direction = new Point(1, 0);

        // Plots the initial position of the snake.
        let head = this.getHead();
        led.plot(head.X, head.Y);
    }

    getLength(): number {
        return this.Body.length - 1;
    }

    getHead(): Point {
        return this.Body[this.Body.length - 1];
    }

    // Determines whether the given point lies inside the snake.
    containsPoint(p: Point): boolean {
        return this.headContainsPoint(p) || this.bodyContainsPoint(p);
    }

    // Determines whether the given point matches the position of the head of the snake.
    headContainsPoint(p: Point): boolean {
        let head = this.Body[this.Body.length - 1];

        return head.X == p.X && head.Y == p.Y;
    }

    // Determines whether the given point lies inside the snake, excluding the head.
    bodyContainsPoint(p: Point): boolean {
        for (let i = 0; i < this.Body.length - 1; i++) {
            let point = this.Body[i];

            if (point.X == p.X && point.Y == p.Y) {
                return true;
            }
        }

        return false;
    }

    // Moves the head of the snake in the direction that the snake is moving and
    // determines whether or not the head now collides with the body.
    moveHead(): boolean {
        let head = this.getHead();

        // Calculates the next position of the head.
        let newHead = new Point(head.X + this.Direction.X, head.Y + this.Direction.Y);

        newHead.wrapToScreen(SCREEN_WIDTH, SCREEN_HEIGHT);

        // Determine whether the head is colliding with the body of the snake.
        let collided = this.bodyContainsPoint(newHead);

        // Actually move the head.
        this.Body.push(newHead);
        led.plot(newHead.X, newHead.Y);

        return collided;
    }

    // Moves the tail of the snake.
    moveTail() {
        let tail = this.Body.removeAt(0);

        // Only unplot the tail if the head is not in the same location.
        if (!this.getHead().equals(tail))
            led.unplot(tail.X, tail.Y);
    }

    // Turns the snake 90 degrees left.
    turnLeft() {
        this.Direction = new Point(this.Direction.Y, -this.Direction.X);
    }

    // Turns the snake 90 degrees right.
    turnRight() {
        this.Direction = new Point(-this.Direction.Y, this.Direction.X);
    }
}

input.onButtonPressed(Button.A, function () {
    if (CONTROL_SCHEME == InputMethod.Buttons)
        snake.turnLeft();
})

input.onButtonPressed(Button.B, function () {
    if (CONTROL_SCHEME == InputMethod.Buttons)
        snake.turnRight();
})

input.onButtonPressed(Button.AB, function () {
    if (CONTROL_SCHEME == InputMethod.Buttons)
        snake.turnLeft();
})

function getDirectionFromTilt(): Point {
    let gx = input.acceleration(Dimension.X);
    let gy = input.acceleration(Dimension.Y);

    if (Math.abs(gx) >= Math.abs(gy)) {
        if (gx >= 0) return new Point(1, 0);
        else return new Point(-1, 0);
    }
    else {
        if (gy >= 0) return new Point(0, 1);
        else return new Point(0, -1);
    }
}

basic.forever(function () {
    basic.pause(UPDATE_INTERVAL);

    if (CONTROL_SCHEME == InputMethod.Acceleration)
        snake.Direction = getDirectionFromTilt();

    snake.moveHead();

    if (snake.headContainsPoint(food.Position)) {
        // Collided with food, do not move the tail to grow the snake and place new food.
        food.place(snake);
        score += 1;
    }
    else {
        // Nothing, move the tail of the snake.
        snake.moveTail();
    }

    if (snake.bodyContainsPoint(snake.getHead())) {
        // Collided with self, game over.
        game.setScore(score);
        game.gameOver();
    }
})

let snake = new Snake(0, 0);
let food = new Food(snake);
let score = 0;
