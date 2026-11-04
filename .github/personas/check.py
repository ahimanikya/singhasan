#!/usr/bin/env python3
"""Check the self-contained public persona package, not runtime enforcement."""
import argparse
import copy
import json
from pathlib import Path
import re

NAMES = {'Disha Dash', 'Anvesha Acharya', 'Samanta Chandrasekhar', 'Drishti Senapati'}


def load(base):
    return {'config': json.loads((base / 'config.json').read_text()),
            'documents': {p.relative_to(base).as_posix(): p.read_text() for p in base.rglob('*.md')}}


def validate(data):
    errors = []
    def need(ok, message):
        if not ok:
            errors.append(message)
    c, docs = data['config'], data['documents']
    need(c.get('schema_version') == '1.0' and c.get('version') == '1.1.0', 'Unsupported package version')
    need(c.get('project') == 'Singhasan' and c.get('prefix') == 'SGH'
         and c.get('package_kind') == 'public_framework_export', 'Wrong project/package identity')
    auth = c.get('authorization', {})
    owner = auth.get('human_owner')
    need(owner == 'Ahimanikya Satapathy' and auth.get('adopted_on') == '2026-11-04'
         and auth.get('assignment_decision') == 'SGH-DEC-006'
         and auth.get('framework_decision') == 'SGH-DEC-007' and bool(auth.get('summary')),
         'Missing public adoption declaration')
    need(c.get('execution_mode') == 'task_scoped_agents', 'Expected task-scoped execution')
    need(c.get('dispatch_policy') == 'default_for_substantive_authorized_tasks', 'Wrong dispatch scope')
    need(c.get('background_execution') is False and c.get('autonomous_dispatch') is False,
         'Unbounded or background work is outside the framework')
    need(bool(c.get('autonomous_dispatch_meaning')) and bool(c.get('publication_authority')),
         'Missing dispatch or publication boundary')
    need(c.get('access_added') == [] and c.get('human_reports_to_personas') is False,
         'Unexpected access or human reporting change')
    need(c.get('operating_model') == 'operating-model.md' and c.get('operating_model') in docs,
         'Missing operating guide')
    need(c.get('local_runtime_record') == '.local/persona-tasks.json', 'Runtime evidence must remain local')
    personas = c.get('personas', [])
    need(len(personas) == 4 and {p.get('name') for p in personas} == NAMES, 'Expected four Blueprint personas')
    for field, tag in [('id', 'PER'), ('assignment_id', 'ASG'), ('jd_id', 'JD')]:
        need({p.get(field) for p in personas} == {f'SGH-{tag}-{n:03d}' for n in range(1, 5)},
             'Duplicate or invalid ' + field)
    need(len({p.get('brief') for p in personas}) == 4, 'Briefs must be distinct')
    for p in personas:
        need(p.get('kind') == 'ai_persona' and p.get('reports_to') == owner,
             'Every AI persona must report directly to the human owner')
        expected = 'root_coordinator' if p.get('name') == 'Disha Dash' else 'separate_task_scoped_agent'
        need(p.get('execution') == expected and p.get('runtime_state') == 'on_demand_not_continuous',
             'Wrong role runtime declaration')
        need(p.get('jd_version') == c.get('version') and bool(p.get('role')), 'Missing role/version')
        brief = docs.get(p.get('brief'), '')
        need(bool(brief), 'Missing public brief: ' + str(p.get('brief')))
        if brief:
            need(all(str(p.get(key, '')) in brief for key in ('name', 'jd_id', 'assignment_id'))
                 and 'v'+p.get('jd_version', '') in brief, 'Brief identity/version mismatch')
    # Resolve Markdown paths solely within this exported package, never the private KB.
    for name, content in docs.items():
        for link in re.findall(r'\]\(([^)]+)\)', content):
            target = link.split('#', 1)[0]
            if not target:
                continue
            if '://' in target or target.startswith('/'):
                errors.append('External/absolute documentation dependency: ' + name)
                continue
            pieces = list(Path(name).parent.parts)
            escaped = False
            for part in Path(target).parts:
                if part == '..':
                    if pieces:
                        pieces.pop()
                    else:
                        escaped = True
                elif part != '.':
                    pieces.append(part)
            resolved = '/'.join(pieces)
            need(not escaped and (resolved in docs or resolved == 'config.json'),
                 'Missing or unsafe local documentation link: ' + name + ' -> ' + target)
    # A conservative hygiene screen; this is not a proof that all private data is absent.
    serialized = json.dumps(c, ensure_ascii=False) + '\n' + '\n'.join(docs.values())
    for marker in ('/Users/', '/root/', 'kb/registers/', 'kb/history/', 'kb/records/', 'plugin://', 'chat_id', 'thread_id'):
        need(marker not in serialized, 'Private/internal marker in public package: ' + marker)
    return errors


def self_test(data):
    mutations = {
        'background_execution': lambda d: d['config'].update(background_execution=True),
        'unbounded_dispatch': lambda d: d['config'].update(autonomous_dispatch=True),
        'disabled_default_delegation': lambda d: d['config'].update(dispatch_policy='only_on_new_request'),
        'continuous_runtime': lambda d: d['config'].update(execution_mode='continuous_workers'),
        'new_access': lambda d: d['config'].update(access_added=['deployment']),
        'human_reports_to_ai': lambda d: d['config'].update(human_reports_to_personas=True),
        'agent_manager': lambda d: d['config']['personas'][1].update(reports_to='Disha Dash'),
        'duplicate_identity': lambda d: d['config']['personas'][1].update(id='SGH-PER-001'),
        'wrong_reviewer_mode': lambda d: d['config']['personas'][3].update(execution='same_assistant_only'),
        'missing_brief': lambda d: d['config']['personas'][0].update(brief='roles/missing.md'),
        'version_drift': lambda d: d['config']['personas'][0].update(jd_version='9.0.0'),
        'missing_local_link': lambda d: d['documents'].update({'operating-model.md':'[Missing](absent.md)'}),
        'private_dependency': lambda d: d['documents'].update({'operating-model.md':'[Private](../../kb/records/private.json)'}),
        'absolute_private_path': lambda d: d['config']['authorization'].update(summary='/Users/example/private'),
        'public_runtime_record': lambda d: d['config'].update(local_runtime_record='.github/personas/tasks.json'),
    }
    result = {}
    for name, mutate in mutations.items():
        candidate = copy.deepcopy(data)
        mutate(candidate)
        result[name] = bool(validate(candidate))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    try:
        data = load(Path(__file__).resolve().parent)
        errors = validate(data)
        negative = self_test(data) if args.self_test and not errors else {}
        passed = not errors and all(negative.values())
        print(json.dumps({'result': 'PASS' if passed else 'FAIL', 'personas': 4, 'errors': errors,
                          'invalid_configurations_rejected': negative,
                          'scope': 'Public package declarations only; no runtime enforcement, consent proof or private-record validation.'}, indent=2))
        raise SystemExit(0 if passed else 1)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({'result': 'FAIL', 'errors': [str(exc)]}))
        raise SystemExit(1)
