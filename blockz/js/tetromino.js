/**
 * Tetris Tetromino Definitions, SRS Rotation & 7-Bag Randomizer
 */

export const TETROMINOES = {
  I: {
    name: 'I',
    color: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.6)',
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  O: {
    name: 'O',
    color: '#ffff00',
    glowColor: 'rgba(255, 255, 0, 0.6)',
    shape: [
      [1, 1],
      [1, 1]
    ]
  },
  T: {
    name: 'T',
    color: '#b026ff',
    glowColor: 'rgba(176, 38, 255, 0.6)',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  S: {
    name: 'S',
    color: '#00ff66',
    glowColor: 'rgba(0, 255, 102, 0.6)',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]
  },
  Z: {
    name: 'Z',
    color: '#ff2255',
    glowColor: 'rgba(255, 34, 85, 0.6)',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  },
  J: {
    name: 'J',
    color: '#0088ff',
    glowColor: 'rgba(0, 136, 255, 0.6)',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  L: {
    name: 'L',
    color: '#ff9900',
    glowColor: 'rgba(255, 153, 0, 0.6)',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  }
};

export function rotateMatrix(matrix, clockwise = true) {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (clockwise) {
        result[c][n - 1 - r] = matrix[r][c];
      } else {
        result[n - 1 - c][r] = matrix[r][c];
      }
    }
  }

  return result;
}

export class Randomizer {
  constructor() {
    this.bag = [];
  }

  next() {
    if (this.bag.length === 0) {
      this.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      // Fisher-Yates shuffle
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    const type = this.bag.pop();
    const proto = TETROMINOES[type];
    return {
      type: proto.name,
      color: proto.color,
      glowColor: proto.glowColor,
      shape: proto.shape.map(row => [...row]),
      x: Math.floor((10 - proto.shape[0].length) / 2),
      y: proto.name === 'I' ? -1 : 0
    };
  }
}
