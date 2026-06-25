import debounce from 'lodash.debounce';
import { type KeyboardEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { type User } from '@/interface/user';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface Props {
  defaultSuggestions: Map<string, User>;
  input: string;
  onSelect: (tag: string) => void;
}

const MAX_COMMENT_SUGGESTIONS = 5;

export const Suggestions = ({ defaultSuggestions, input, onSelect }: Props) => {
  const [suggestions, setSuggestions] =
    useState<Map<string, User>>(defaultSuggestions);
  const [searchSuggestions, setSearchSuggestions] =
    useState<Map<string, User>>(defaultSuggestions);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  async function filterSuggestions(text: string) {
    if (text === '') {
      setSuggestions(searchSuggestions);
    } else {
      if (suggestions.size < MAX_COMMENT_SUGGESTIONS) {
        const searchResp = await api.get('/api/user/search', {
          params: {
            query: text,
            take: MAX_COMMENT_SUGGESTIONS - suggestions.size,
          },
        });
        const users = searchResp.data.users as User[];
        users.forEach((user) => {
          if (user.id) searchSuggestions.set(user.id, user);
        });
        setSearchSuggestions(searchSuggestions);
      }
      const filteredSuggestions = new Map<string, User>();
      searchSuggestions.forEach((value, key) => {
        if (
          value.username?.toLowerCase().includes(text.toLowerCase()) ||
          value.firstName?.toLowerCase().includes(text.toLowerCase()) ||
          value.lastName?.toLowerCase().includes(text.toLowerCase())
        ) {
          filteredSuggestions.set(key, value);
        }
      });
      setSuggestions(filteredSuggestions);
    }
  }

  useEffect(() => {
    const debouncedFilterSuggestions = debounce(() => {
      filterSuggestions(getLastWord(input));
    }, 300);
    debouncedFilterSuggestions();
    return () => {
      debouncedFilterSuggestions.cancel();
    };
  }, [input]);

  useEffect(() => {
    const handleKeyPress = (event: globalThis.KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          onSelect([...suggestions.values()][activeIndex]?.username ?? '');
          break;
        case 'ArrowUp':
          if (activeIndex === 0) {
            setActiveIndex(suggestions.size - 1);
          } else {
            setActiveIndex(activeIndex - 1);
          }
          break;
        case 'Tab':
        case 'ArrowDown':
          if (activeIndex === suggestions.size - 1) {
            setActiveIndex(0);
          } else {
            setActiveIndex(activeIndex + 1);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeIndex, suggestions]);

  if (suggestions.size === 0) return null;

  return (
    <div className="flex w-[15rem] flex-col items-start gap-2  border border-[#E6DCC9] bg-[#FBF7EF] p-1 ">
      {[...suggestions.values()]
        .slice(0, MAX_COMMENT_SUGGESTIONS)
        .map((suggestion, index) => (
          <Button
            key={suggestion.id}
            variant="ghost"
            className={cn(
              'flex w-full justify-start gap-2  p-1',
              activeIndex === index ? 'bg-[#C4502E]/25' : 'bg-transparent',
              'hover:bg-[#F2EAD9] active:bg-[#e7d3c1]',
            )}
            onClick={() => onSelect(suggestion.username ?? '')}
          >
            <EarnAvatar
              className="h-7 w-7"
              id={suggestion?.id}
              avatar={suggestion?.photo}
            />
            <div className="flex flex-col items-start">
              <p className="text-sm font-medium text-[#221A14]">
                {suggestion.firstName} {suggestion.lastName}
              </p>
              <p className="max-w-[10rem] overflow-hidden text-xs font-medium text-ellipsis text-[#5C5147]">
                @{suggestion.username}
              </p>
            </div>
          </Button>
        ))}
    </div>
  );
};

function getLastWord(str: string): string {
  const lastAtIndex = str.lastIndexOf('@');
  return str.slice(lastAtIndex + 1);
}

function replaceLastAtWord(str: string, replacement: string): string {
  const lastAtIndex = str.lastIndexOf('@');
  const removeLastWord = str.slice(0, lastAtIndex);
  return `${removeLastWord}${replacement}`;
}

export function addMention(str: string, username: string): string {
  return replaceLastAtWord(str, `@${username} `);
}

export function userSuggestionOverrider(
  event: KeyboardEvent<HTMLTextAreaElement>,
  lastInput: string,
  hideSuggestions: () => void,
) {
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      break;
    case 'ArrowUp':
      event.preventDefault();
      break;
    case 'ArrowDown':
      event.preventDefault();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      break;
    case 'ArrowRight':
      event.preventDefault();
      break;
    case 'Tab':
      event.preventDefault();
      break;
    case 'Escape':
      hideSuggestions();
      break;
    case 'Backspace':
      if (lastInput[lastInput.length - 1] === '@') {
        hideSuggestions();
      }
      break;
    case ' ':
      hideSuggestions();
      break;
    default:
      break;
  }
}
