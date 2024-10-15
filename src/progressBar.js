import cliProgress from 'cli-progress';

export const progressBar = new cliProgress.SingleBar({
  format: 'Progress |{bar}| {percentage}% | {value}/{total} Tasks | ETA: {eta}s | Speed: {speed} tasks/s',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});