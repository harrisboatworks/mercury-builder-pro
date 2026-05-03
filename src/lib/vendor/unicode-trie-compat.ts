import * as UnicodeTrieModule from '../../../node_modules/unicode-trie/index.js';

const UnicodeTrie = (UnicodeTrieModule as { default?: unknown }).default || UnicodeTrieModule;

export default UnicodeTrie;
