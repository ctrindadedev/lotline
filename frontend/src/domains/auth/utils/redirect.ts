/** What a page that needs a login passes to it, so the user comes back where they were. */
export interface AuthRedirect {
  from?: string;
  reason?: 'listPlot' | 'seeContact';
}
