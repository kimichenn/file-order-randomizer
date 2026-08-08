const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const coreSource = fs.readFileSync(
    path.join(__dirname, "..", "jsx", "randomizer-core.jsx"),
    "utf8"
);
const controlledMath = Object.create(Math);
const context = {
    Math: controlledMath,
    Date: Date,
    isFinite: isFinite,
    isNaN: isNaN,
    parseFloat: parseFloat,
    parseInt: parseInt
};

vm.createContext(context);
vm.runInContext(coreSource, context);

const ticksPerSecond = 254016000000;

assert.deepStrictEqual(
    JSON.parse(JSON.stringify(context.getImageDurationRange({ imageDuration: 3 }))),
    { min: 3, max: 3 }
);
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(context.getImageDurationRange({
        randomizeImageDuration: true,
        imageDurationMin: 2,
        imageDurationMax: 5
    }))),
    { min: 2, max: 5 }
);
assert.strictEqual(context.getImageDurationRange({ imageDuration: null }), null);
assert.strictEqual(
    context.getImageDurationRange({
        randomizeImageDuration: true,
        imageDurationMin: 5,
        imageDurationMax: 2
    }).error,
    "Minimum image duration cannot exceed the maximum."
);

controlledMath.random = function() { return 0.25; };
assert.strictEqual(
    context.getRandomImageDurationTicks({ min: 2, max: 6 }),
    3 * ticksPerSecond
);
assert.strictEqual(
    context.getRandomImageDurationTicks({ min: 4, max: 4 }),
    4 * ticksPerSecond
);
assert.strictEqual(context.getRandomImageDurationTicks(null), null);

function createTrack() {
    const clips = [];
    Object.defineProperty(clips, "numItems", {
        get: function() { return clips.length; }
    });

    return {
        clips: clips,
        insertClip: function(item, start) {
            const startTicks = parseInt(start, 10);
            let endTime = {
                ticks: (startTicks + item.naturalDurationTicks).toString()
            };
            const clip = {
                item: item,
                start: { ticks: startTicks.toString() }
            };
            Object.defineProperty(clip, "end", {
                get: function() { return endTime; },
                set: function(value) { endTime = { ticks: value.toString() }; }
            });
            clips.push(clip);
        }
    };
}

context.getMediaType = function(item) { return item.mediaType; };

const videoTrack = createTrack();
const audioTrack = createTrack();
const sequence = {
    videoTracks: [videoTrack],
    audioTracks: [audioTrack]
};
const items = [
    { mediaType: "Image", naturalDurationTicks: 10 * ticksPerSecond },
    { mediaType: "Movie", naturalDurationTicks: 7 * ticksPerSecond },
    { mediaType: "Image", naturalDurationTicks: 10 * ticksPerSecond }
];
const randomValues = [0, 0.75];
controlledMath.random = function() { return randomValues.shift(); };

context.insertClipsUnified(sequence, items, 0, { min: 2, max: 6 });

assert.strictEqual(
    parseInt(videoTrack.clips[0].end.ticks, 10) - parseInt(videoTrack.clips[0].start.ticks, 10),
    2 * ticksPerSecond
);
assert.strictEqual(
    parseInt(videoTrack.clips[1].end.ticks, 10) - parseInt(videoTrack.clips[1].start.ticks, 10),
    7 * ticksPerSecond,
    "video duration should remain unchanged"
);
assert.strictEqual(
    parseInt(videoTrack.clips[2].end.ticks, 10) - parseInt(videoTrack.clips[2].start.ticks, 10),
    5 * ticksPerSecond
);

console.log("randomizer-core tests passed");
