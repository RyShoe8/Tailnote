export type HallOfFameSubmission = {
  isVoteWinner?: boolean;
  hallOfFame?: boolean;
};

export function canManageHallOfFame(submission: HallOfFameSubmission): boolean {
  return submission.isVoteWinner === true || submission.hallOfFame === true;
}

export function canAddToHallOfFame(submission: HallOfFameSubmission): boolean {
  return submission.isVoteWinner === true;
}
