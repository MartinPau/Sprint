/**
 * Configuration file for the Treadmill Sync App
 * 
 * Edit this file to map the timeline of the video.
 * `workoutData` is an array where each item represents the speed 
 * for a 1-minute interval. 
 * E.g., The first item in the list is from 0:00 to 0:59, the second is 1:00 to 1:59.
 */

const videoId = 'PzMFqhGXQSw'; // The YouTube Video ID

// The time in seconds where the actual 00:00 workout timer starts in the video.
// For example, if the intro takes 45 seconds and the workout timer begins then, set this to 45.
const videoOffsetSeconds = 33;

// Example 30-minute HIIT speeds (in km/h)
const workoutData = [
    // Minutes 1-5 (Warm up)
    4.5, 8.0, 8.0, 8.0, 5.0,
    // Minutes 6-10 (Intervals)
    9.5, 5.0, 12.0, 5.0, 13.0,
    // Minutes 11-15 (Intervals)
    5.0, 14.0, 5.0, 15.0, 5.0,
    // Minutes 16-20 (Intervals)
    16.0, 5.0, 17.0, 5.0, 18.0,
    // Minutes 21-25 (Intervals)
    5.0, 19.0, 5.0, 20.0, 5.0,
    // Minutes 26-30 (Cool down)
    9.5, 6.0, 5.0, 4.5, 4.0
];
