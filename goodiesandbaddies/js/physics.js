/**
 * Goodies and Baddies 2D Kinematics and Collision Math
 */

export const GRAVITY = 920; // px/s^2
export const MAX_FALL_SPEED = 480; // px/s
export const WALK_SPEED = 150; // px/s
export const JUMP_VELOCITY = -380; // px/s upward launch
export const CLIMB_SPEED = 115; // px/s

/**
 * Checks axis-aligned bounding box intersection
 */
export function checkAABB(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Checks if a point (px, py) is inside an AABB box
 */
export function pointInAABB(px, py, box) {
  return (
    px >= box.x &&
    px <= box.x + box.width &&
    py >= box.y &&
    py <= box.y + box.height
  );
}

/**
 * Checks circle-circle intersection (supports both object and parameter signatures)
 */
export function checkCircleCircle(c1xOrObj, c1yOrObj, r1, c2x, c2y, r2) {
  let c1x, c1y, rad1, c2X, c2Y, rad2;
  if (typeof c1xOrObj === 'object') {
    c1x = c1xOrObj.x;
    c1y = c1xOrObj.y;
    rad1 = c1xOrObj.radius;
    c2X = c1yOrObj.x;
    c2Y = c1yOrObj.y;
    rad2 = c1yOrObj.radius;
  } else {
    c1x = c1xOrObj;
    c1y = c1yOrObj;
    rad1 = r1;
    c2X = c2x;
    c2Y = c2y;
    rad2 = r2;
  }
  const dx = c2X - c1x;
  const dy = c2Y - c1y;
  const rSum = rad1 + rad2;
  return dx * dx + dy * dy <= rSum * rSum;
}

/**
 * Checks circle against an AABB box (supports both object and parameter signatures)
 */
export function checkCircleAABB(cxOrCircle, cyOrBox, r, bx, by, bw, bh) {
  let cx, cy, rad, bX, bY, bW, bH;
  if (typeof cxOrCircle === 'object') {
    cx = cxOrCircle.x;
    cy = cxOrCircle.y;
    rad = cxOrCircle.radius;
    bX = cyOrBox.x;
    bY = cyOrBox.y;
    bW = cyOrBox.width;
    bH = cyOrBox.height;
  } else {
    cx = cxOrCircle;
    cy = cyOrBox;
    rad = r;
    bX = bx;
    bY = by;
    bW = bw;
    bH = bh;
  }
  const closestX = Math.max(bX, Math.min(cx, bX + bW));
  const closestY = Math.max(bY, Math.min(cy, bY + bH));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= rad * rad;
}

/**
 * Detects if an entity overlaps with any ladder in the stage
 */
export function findOverlappingLadder(entity, ladders) {
  const eCenterX = entity.x + entity.width / 2;
  const eBottomY = entity.y + entity.height;
  const eTopY = entity.y;

  for (const ladder of ladders) {
    if (
      eCenterX >= ladder.x - 10 &&
      eCenterX <= ladder.x + ladder.width + 10 &&
      eBottomY >= ladder.y &&
      eTopY <= ladder.y + ladder.height
    ) {
      return ladder;
    }
  }
  return null;
}
