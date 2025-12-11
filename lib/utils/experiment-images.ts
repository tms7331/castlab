/**
 * Maps experiment IDs to their corresponding GIF images.
 * Returns the mapped GIF path if available, otherwise returns the original image_url.
 */

const EXPERIMENT_GIF_MAP: Record<number, string> = {
  0: '/castlab_pickup.gif',
  1: '/castlab_sativa.gif',
  3: '/castlab_charts.gif',
};

export function getExperimentImage(experimentId: number, fallbackImageUrl?: string | null): string | null {
  if (experimentId in EXPERIMENT_GIF_MAP) {
    return EXPERIMENT_GIF_MAP[experimentId];
  }
  return fallbackImageUrl ?? null;
}
