
import React from 'react';
import { Sun, Moon, Waves, Check } from 'lucide-react';
import { useTheme, themes } from './ThemeContext';

const themeIcons: Record<string, React.ReactNode> = {
    dark: <Moon size={16} />,
    light: <Sun size={16} />,
    oceanic: <Waves size={16} />,
};

const ThemeSwitcher: React.FC = () => {
    const { theme: currentTheme, setTheme } = useTheme();

    return (
        <div className="bg-background-tertiary/50 p-6 rounded-xl border border-border-primary">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Theme</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {themes.map((theme) => (
                    <button
                        key={theme.name}
                        onClick={() => setTheme(theme.name)}
                        className={`relative p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            currentTheme === theme.name
                                ? 'border-accent-primary bg-accent-primary/10'
                                : 'border-border-secondary hover:border-accent-secondary'
                        }`}
                        aria-pressed={currentTheme === theme.name}
                    >
                        <div className="flex items-center gap-2 text-text-primary">
                            {themeIcons[theme.name]}
                            <span className="font-semibold capitalize">{theme.name}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--bg-secondary'] }}></div>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--accent-primary'] }}></div>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--text-secondary'] }}></div>
                        </div>
                         {currentTheme === theme.name && (
                            <div className="absolute top-2 right-2 text-accent-primary">
                                <Check size={16} strokeWidth={3} />
                            </div>
                         )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSwitcher;