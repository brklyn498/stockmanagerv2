import { Context, Scenes } from 'telegraf';

// Session data interface
// It must intersect with Scenes.WizardSession to satisfy the constraint
export interface SessionData extends Scenes.WizardSessionData {
  // Global session data
  lastProductId?: string;
  recentSearches?: string[];
  undoStack?: UndoAction[];

  // Required by Telegraf Scenes
  __scenes?: Scenes.WizardSessionData;
}

interface UndoAction {
  type: 'stock_movement';
  movementId: string;
  expiresAt: number;
}

// Custom Context interface
export interface BotContext extends Context {
  // Session property
  session: SessionData;
  // Scene context
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  // Wizard context
  wizard: Scenes.WizardContextWizard<BotContext>;
}
