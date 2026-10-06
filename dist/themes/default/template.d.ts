import { type ComposerState } from '../../core/utils/dictation';
import type { ChatState, WidgetState } from '../../core/types';
export declare function renderUnified(widgetState: WidgetState, state: ChatState, config: {
    title: string;
    placeholder: string;
    showClose: boolean;
    lang: string;
    mode?: string;
    position?: string;
    suggestions?: string[];
}, hasInput: boolean, composer?: ComposerState): string;
//# sourceMappingURL=template.d.ts.map