export function getPerspective(score: number): string {
  if (score >= 0.8) {
    return "Toxic";
  } else if (score >= 0.5) {
    return "Neutral";
  }
  return "Clean";
}
