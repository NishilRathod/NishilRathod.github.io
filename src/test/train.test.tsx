import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { LazyMotion, domAnimation } from "motion/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { carCount, compartments, indexOfCar } from "../content/compartments";
import { Train } from "../train/Train";

/**
 * The carriage, driven in jsdom.
 *
 * None of the 3D is real here — there is no compositor and no layout — so this
 * asserts the things that are real regardless: what the controls do, what ends
 * up in the document, and what the URL says. The geometry is a matter for a
 * browser and the physics has its own suite in `trainCamera.test.ts`.
 *
 * The render loop is driven by hand rather than left to run. `useTrainCamera`
 * re-registers its own frame at the top of every tick, so letting the real
 * `requestAnimationFrame` loose in a test means an unbounded loop racing the
 * assertions; collecting the callbacks and calling them makes time an argument.
 */

const frames: FrameRequestCallback[] = [];
let clock = 0;

/** Run the loop for `ms` of simulated time at roughly 60fps. */
function advance(ms: number) {
  act(() => {
    for (let elapsed = 0; elapsed < ms; elapsed += 16) {
      clock += 16;
      for (const frame of frames.splice(0)) frame(clock);
    }
  });
}

const renderTrain = ({ reduced = false, at = "" } = {}) => {
  window.history.replaceState(null, "", at ? `#${at}` : " ");
  // The provider `App` supplies. The terminus car's contact poster reuses
  // `MagneticLink`, which is an `m.a`.
  return render(
    <LazyMotion features={domAnimation} strict>
      <Train reduced={reduced} onLeave={() => {}} />
    </LazyMotion>,
  );
};

/** The car the line map says you are in. */
const currentCar = () => screen.getByRole("button", { current: true }).getAttribute("aria-label");

/**
 * The label the line map gives a car, built from the manifest rather than
 * written out. Car numbers come from position, so inserting a compartment
 * renumbers every car after it and any hand-written "Car 07" goes stale.
 */
const carLabel = (id: string) => {
  const car = compartments[indexOfCar(id)];
  return `Car ${car.code}, ${car.destination}`;
};

/**
 * The platform prompt, if it is showing.
 *
 * Matched as a whole paragraph because the line is split across elements to
 * emphasise the key — `Press <span>W</span> to board` is three text nodes, and
 * a plain string query sees none of them. Scoping to `p` keeps the ancestors
 * that also contain the phrase out of the result.
 */
const boardPrompt = () =>
  screen.queryAllByText(
    (_, element) =>
      element?.tagName === "P" && /press w to board/i.test(element.textContent ?? ""),
  );

beforeEach(() => {
  frames.length = 0;
  clock = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    frames.push(callback),
  );
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", " ");
});

describe("the whole train is always in the document", () => {
  it("mounts every car, not just the one being looked at", () => {
    // The Ctrl+F and screen-reader guarantee: a résumé that blinks in and out
    // as you drive is not a résumé anyone can search.
    renderTrain({ reduced: true });

    expect(screen.getAllByRole("region")).toHaveLength(compartments.length);

    for (const car of compartments) {
      expect(
        screen.getByRole("region", { name: `Car ${car.code} — ${car.destination}` }),
      ).toBeInTheDocument();
    }
  });

  it("takes the page's scrolling away only while it is mounted", () => {
    const { unmount } = renderTrain({ reduced: true });
    expect(document.body).toHaveClass("is-riding");

    unmount();
    expect(document.body).not.toHaveClass("is-riding");
  });
});

/**
 * The performance characteristics, asserted rather than assumed.
 *
 * Both of these were real defects that shipped, and neither is visible from
 * inside the app: the page just gradually feels worse and nobody can say why.
 * They only show up under a profiler, so they belong in a test where they show
 * up in a second instead.
 */
describe("the render loop costs nothing while you are parked", () => {
  it("stops scheduling frames once the camera has settled, and wakes on input", () => {
    // A loop that runs forever restyles the whole carriage sixty times a second
    // for a scene that is not moving. Standing still is the state a visitor
    // spends nearly all of their time in, so it has to be the cheap one.
    renderTrain({ reduced: true });

    advance(200);
    expect(frames).toHaveLength(0);

    fireEvent.keyDown(window, { code: "KeyW" });
    expect(frames.length).toBeGreaterThan(0);

    advance(200);
    expect(currentCar()).toBe(`Car 02, ${compartments[1].destination}`);
    expect(frames).toHaveLength(0);
  });

  it("drives the windows from CSS, not from a custom property written per frame", () => {
    // `--streak-far` and `--streak-near` were set on the element every car
    // inherits from, once per frame. An inherited custom property invalidates
    // the style of its whole subtree, so those two writes restyled ~800
    // elements sixty times a second — about 40% of the frame budget, spent
    // while parked on the platform with nothing moving.
    const { container } = renderTrain();
    advance(500);

    const styled = container.querySelectorAll<HTMLElement>("[style]");
    for (const element of styled) {
      expect(element.style.getPropertyValue("--streak-far")).toBe("");
      expect(element.style.getPropertyValue("--streak-near")).toBe("");
    }

    // And the strips are still there, animated by the stylesheet.
    expect(container.querySelectorAll(".streak-far").length).toBeGreaterThan(0);
  });

  it("builds the room around the nearby cars only, and never culls a word", () => {
    // A shell is sixteen planes, two of them 1920x2400, and each is its own
    // compositor layer because it has to be depth-sorted. Eight of them was
    // ~650MB of backing store against a GPU budget of a few hundred, so Chrome
    // sat there evicting tiles and rasterising them again — the "crumbling".
    //
    // What makes this safe is that the camera only ever translates: the view
    // forward stops dead at the next bulkhead and its shut doors, so a car two
    // along is behind an opaque wall whether it is built or not.
    const { container } = renderTrain({ reduced: true });
    advance(16);

    // Parked in car 01, so cars 01 and 02 have rooms and the other six do not.
    // Counted as cars-with-a-room rather than as windows: how many panes of
    // glass a carriage has is a matter of taste and has already changed twice,
    // but which cars get built is the thing this test is actually about.
    const carsWithARoom = [...container.querySelectorAll("section[aria-label]")].filter(
      (section) => section.querySelector(".streak-far"),
    );
    expect(carsWithARoom).toHaveLength(2);

    // The half that must never be conditional: all eight cars, and the words on
    // the terminus poster while standing at the other end of the train.
    expect(screen.getAllByRole("region")).toHaveLength(compartments.length);
    const terminus = compartments[compartments.length - 1];
    expect(
      screen.getByRole("region", { name: `Car ${terminus.code} — ${terminus.destination}` }),
    ).toBeInTheDocument();
  });

  it("builds the car ahead but never the one behind", () => {
    // The camera translates and never turns, so the car you just left is behind
    // your head at every point of the journey. Building it was a third of the
    // scenery on screen — eight windows and the sixteen animating layers their
    // streaks run on — for a room nobody can look at.
    //
    // Car 01 cannot catch this: there is nothing behind it, so the count is two
    // either way. It has to be tested from the middle of the train.
    const { container } = renderTrain({ reduced: true });
    advance(16);

    fireEvent.keyDown(window, { code: "Digit4" });
    advance(64);

    const built = [...container.querySelectorAll("section[aria-label]")]
      .filter((section) => section.querySelector(".streak-far"))
      .map((section) => section.getAttribute("aria-label"));

    expect(built).toEqual([
      `Car ${compartments[3].code} — ${compartments[3].destination}`,
      `Car ${compartments[4].code} — ${compartments[4].destination}`,
    ]);
  });
});

describe("driving", () => {
  // Reduced motion turns each press into a discrete arrival, which is the same
  // input path without a second of travel to simulate first.
  const setup = () => {
    renderTrain({ reduced: true });
    advance(16);
    expect(currentCar()).toBe(`Car 01, ${compartments[0].destination}`);
  };

  it("moves forward on W and back on S", () => {
    setup();

    fireEvent.keyDown(window, { code: "KeyW" });
    advance(16);
    expect(currentCar()).toBe(`Car 02, ${compartments[1].destination}`);

    fireEvent.keyDown(window, { code: "KeyS" });
    advance(16);
    expect(currentCar()).toBe(`Car 01, ${compartments[0].destination}`);
  });

  it("also accepts the arrow keys, for anyone who never played a game", () => {
    setup();

    fireEvent.keyDown(window, { code: "ArrowUp" });
    advance(16);
    expect(currentCar()).toBe(`Car 02, ${compartments[1].destination}`);
  });

  it("remembers a number pressed on the platform, across the boarding move", () => {
    // Full motion, so the scripted 1.6s boarding move actually runs. The jump
    // used to be read at the top of the very first tick and dropped by the
    // boarding branch a line later, so the one shortcut the opening hint
    // advertises put you in car 01 and looked like a dead key.
    renderTrain();
    advance(16);

    fireEvent.keyDown(window, { code: "Digit4" });
    advance(4000);

    expect(currentCar()).toBe(`Car 04, ${compartments[3].destination}`);
  });

  it("jumps straight to a car on a number key", () => {
    setup();

    fireEvent.keyDown(window, { code: "Digit3" });
    advance(16);
    expect(currentCar()).toBe(`Car 03, ${compartments[2].destination}`);
  });

  // The jump keys span Digit1..Digit9 only, so this guard can be exercised from
  // the keyboard only while the train is shorter than that.
  it.skipIf(carCount >= 9)("ignores a number with no car behind it", () => {
    setup();

    fireEvent.keyDown(window, { code: `Digit${carCount + 1}` });
    advance(16);
    expect(currentCar()).toBe(carLabel(compartments[0].id));
  });

  it("reaches the last car with its own digit", () => {
    // The boarding notice promises that pressing a number jumps straight to
    // that car. There is no Digit10, so a tenth compartment would quietly make
    // that promise false for the end of the train. Fail here rather than let
    // the notice start lying.
    expect(carCount).toBeLessThanOrEqual(9);

    setup();

    fireEvent.keyDown(window, { code: `Digit${carCount}` });
    advance(16);
    expect(currentCar()).toBe(carLabel(compartments[carCount - 1].id));
  });

  it("leaves Ctrl+S to the browser", () => {
    // A single-letter binding that swallows chords is a broken browser, not a
    // clever control scheme.
    setup();

    fireEvent.keyDown(window, { code: "KeyS", ctrlKey: true });
    fireEvent.keyDown(window, { code: "KeyW", metaKey: true });
    advance(16);

    expect(currentCar()).toBe(`Car 01, ${compartments[0].destination}`);
  });

  it("stops at the terminus rather than running into the buffers", () => {
    setup();

    for (let press = 0; press < compartments.length + 4; press += 1) {
      fireEvent.keyDown(window, { code: "KeyW" });
      advance(16);
    }

    const last = compartments[compartments.length - 1];
    expect(currentCar()).toBe(`Car ${last.code}, ${last.destination}`);
  });
});

describe("a key held while the window loses focus", () => {
  it("is released, instead of driving the train the length of the line", () => {
    // Losing focus means the keyup never arrives. Without the blur handler the
    // camera accelerates for as long as the visitor is away.
    renderTrain({ at: "education" });

    fireEvent.keyDown(window, { code: "KeyW" });
    advance(600);

    fireEvent.blur(window);
    advance(6000);

    const reached = currentCar();
    const last = compartments[compartments.length - 1];
    expect(reached).not.toBe(`Car ${last.code}, ${last.destination}`);

    // And it stays put rather than creeping onward.
    advance(4000);
    expect(currentCar()).toBe(reached);
  });
});

describe("boarding", () => {
  it("opens on the platform, and asks to be boarded", () => {
    renderTrain();
    advance(16);

    expect(screen.getByText(/now departing/i)).toBeInTheDocument();
    expect(boardPrompt()).toHaveLength(1);
    // Nothing to be at car 01 of yet, so no line map and no car counter.
    expect(screen.queryByRole("navigation", { name: /cars/i })).toBeNull();
  });

  it("swaps the departure board for the controls once aboard", () => {
    renderTrain();
    advance(16);

    fireEvent.keyDown(window, { code: "KeyW" });
    fireEvent.keyUp(window, { code: "KeyW" });
    advance(2500);

    expect(boardPrompt()).toHaveLength(0);
    expect(screen.getByRole("navigation", { name: /cars/i })).toBeInTheDocument();
  });

  it("skips the platform for anyone who arrived by link", () => {
    // You asked for a specific car; being made to board first would be theatre
    // in the way of the thing you asked for.
    renderTrain({ at: "tech-stack" });
    advance(16);

    expect(boardPrompt()).toHaveLength(0);
    expect(currentCar()).toBe(carLabel("tech-stack"));
  });
});

describe("every car is a URL", () => {
  it("writes the car it arrives in into the address bar", () => {
    renderTrain({ reduced: true });
    advance(16);

    fireEvent.keyDown(window, { code: "KeyW" });
    advance(16);

    expect(window.location.hash).toBe(`#${compartments[1].id}`);
  });

  it("follows the hash when the back button changes it", () => {
    renderTrain({ reduced: true });
    advance(16);

    window.history.replaceState(null, "", "#terminus");
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    advance(16);

    const last = compartments[compartments.length - 1];
    expect(currentCar()).toBe(`Car ${last.code}, ${last.destination}`);
  });
});
