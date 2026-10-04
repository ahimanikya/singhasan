"""Publication authorization is independent of translation review status."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from translation_data import load_translations

class TranslationReleaseTests(unittest.TestCase):
    def load(self, entry):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / 'en.json').write_text(json.dumps({'language': 'en', 'sections': {'1': entry}}))
            return load_translations(path, {'en': {'native': 'English'}})

    def test_only_explicitly_released_drafts_are_included(self):
        entry = {'status': 'draft', 'title': 'Poem 1', 'stanzas': [['Words']]}
        self.assertEqual(self.load(entry), {})
        self.assertEqual(self.load({**entry, 'published': 'true'}), {})
        self.assertEqual(self.load({**entry, 'published': True})[1]['en']['stanzas'], [['Words']])
        self.assertEqual(entry['status'], 'draft')

    def test_released_entries_still_require_complete_text(self):
        with self.assertRaises(ValueError):
            self.load({'status': 'draft', 'published': True, 'title': 'Poem 1', 'stanzas': []})

    def test_ready_entries_remain_available(self):
        self.assertIn('en', self.load({'status': 'ready', 'title': 'Poem 1', 'stanzas': [['Words']]})[1])

if __name__ == '__main__':
    unittest.main()
