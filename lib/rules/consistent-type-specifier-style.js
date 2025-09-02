'use strict';var _contextCompat = require('eslint-module-utils/contextCompat');

var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}

function isComma(token) {
  return token.type === 'Punctuator' && token.value === ',';
}

/**
   * @param {import('eslint').Rule.Fix[]} fixes
   * @param {import('eslint').Rule.RuleFixer} fixer
   * @param {import('eslint').SourceCode.SourceCode} sourceCode
   * @param {(ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[]} specifiers
   * */
function removeSpecifiers(fixes, fixer, sourceCode, specifiers) {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
    for (var _iterator = specifiers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var specifier = _step.value;
      // remove the trailing comma
      var token = sourceCode.getTokenAfter(specifier);
      if (token && isComma(token)) {
        fixes.push(fixer.remove(token));
      }
      fixes.push(fixer.remove(specifier));
    }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator['return']) {_iterator['return']();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
}

/** @type {(node: import('estree').Node, sourceCode: import('eslint').SourceCode.SourceCode, specifiers: (ImportSpecifier | ImportNamespaceSpecifier)[], kind: 'type' | 'typeof') => string} */
function getImportText(
node,
sourceCode,
specifiers,
kind)
{
  var sourceString = sourceCode.getText(node.source);
  if (specifiers.length === 0) {
    return '';
  }

  var names = specifiers.map(function (s) {
    if (s.imported.name === s.local.name) {
      return s.imported.name;
    }
    return String(s.imported.name) + ' as ' + String(s.local.name);
  });
  // insert a fresh top-level import
  return 'import ' + String(kind) + ' {' + String(names.join(', ')) + '} from ' + String(sourceString) + ';';
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Enforce or ban the use of inline type-only markers for named imports.',
      url: (0, _docsUrl2['default'])('consistent-type-specifier-style') },

    fixable: 'code',
    schema: [
    {
      type: 'string',
      'enum': [
      'prefer-inline',
      'prefer-top-level',
      'prefer-top-level-if-only-type-imports'],

      'default': 'prefer-inline' }] },




  create: function () {function create(context) {
      var sourceCode = (0, _contextCompat.getSourceCode)(context);
      var preference = context.options[0];

      if (preference === 'prefer-inline') {
        return {
          ImportDeclaration: function () {function ImportDeclaration(node) {
              if (node.importKind === 'value' || node.importKind == null) {
                // top-level value / unknown is valid
                return;
              }

              if (
              // no specifiers (import type {} from '') have no specifiers to mark as inline
              node.specifiers.length === 0 ||
              node.specifiers.length === 1
              // default imports are both "inline" and "top-level"
              && (
              node.specifiers[0].type === 'ImportDefaultSpecifier'
              // namespace imports are both "inline" and "top-level"
              || node.specifiers[0].type === 'ImportNamespaceSpecifier'))

              {
                return;
              }

              context.report({
                node: node,
                message: 'Prefer using inline {{kind}} specifiers instead of a top-level {{kind}}-only import.',
                data: {
                  kind: node.importKind },

                fix: function () {function fix(fixer) {
                    var kindToken = sourceCode.getFirstToken(node, { skip: 1 });

                    return [].concat(
                    kindToken ? fixer.remove(kindToken) : [],
                    node.specifiers.map(function (specifier) {return fixer.insertTextBefore(specifier, String(node.importKind) + ' ');}));

                  }return fix;}() });

            }return ImportDeclaration;}() };

      }

      // prefer-top-level or prefer-top-level-if-only-type-imports
      return {
        /** @param {import('estree').ImportDeclaration} node */
        ImportDeclaration: function () {function ImportDeclaration(node) {
            if (
            // already top-level is valid
            node.importKind === 'type' ||
            node.importKind === 'typeof'
            // no specifiers (import {} from '') cannot have inline - so is valid
            || node.specifiers.length === 0 ||
            node.specifiers.length === 1
            // default imports are both "inline" and "top-level"
            && (
            node.specifiers[0].type === 'ImportDefaultSpecifier'
            // namespace imports are both "inline" and "top-level"
            || node.specifiers[0].type === 'ImportNamespaceSpecifier'))

            {
              return;
            }

            /** @type {typeof node.specifiers} */
            var typeSpecifiers = [];
            /** @type {typeof node.specifiers} */
            var typeofSpecifiers = [];
            /** @type {typeof node.specifiers} */
            var valueSpecifiers = [];
            /** @type {typeof node.specifiers[number]} */
            var defaultSpecifier = null;var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {
              for (var _iterator2 = node.specifiers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var specifier = _step2.value;
                if (specifier.type === 'ImportDefaultSpecifier') {
                  defaultSpecifier = specifier;
                  continue;
                }

                if (specifier.importKind === 'type') {
                  typeSpecifiers.push(specifier);
                } else if (specifier.importKind === 'typeof') {
                  typeofSpecifiers.push(specifier);
                } else if (specifier.importKind === 'value' || specifier.importKind == null) {
                  valueSpecifiers.push(specifier);
                }
              }} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2['return']) {_iterator2['return']();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}

            var typeImport = getImportText(node, sourceCode, typeSpecifiers, 'type');
            var typeofImport = getImportText(node, sourceCode, typeofSpecifiers, 'typeof');
            var newImports = (String(typeImport) + '\n' + String(typeofImport)).trim();

            if (typeSpecifiers.length + typeofSpecifiers.length === node.specifiers.length) {
              /** @type {('type' | 'typeof')[]} */
              // all specifiers have inline specifiers - so we replace the entire import
              var kind = [].concat(
              typeSpecifiers.length > 0 ? 'type' : [],
              typeofSpecifiers.length > 0 ? 'typeof' : []);


              var messageSuffix = preference === 'prefer-top-level-if-only-type-imports' ? ' when there are only type imports' : '';
              context.report({
                node: node,
                message: 'Prefer using a top-level {{kind}}-only import instead of inline {{kind}} specifiers' + messageSuffix + '.',
                data: {
                  kind: kind.join('/') },

                fix: function () {function fix(fixer) {
                    return fixer.replaceText(node, newImports);
                  }return fix;}() });

            } else if (preference !== 'prefer-top-level-if-only-type-imports') {
              // remove specific specifiers and insert new imports for them
              typeSpecifiers.concat(typeofSpecifiers).forEach(function (specifier) {
                context.report({
                  node: specifier,
                  message: 'Prefer using a top-level {{kind}}-only import instead of inline {{kind}} specifiers.',
                  data: {
                    kind: specifier.importKind },

                  fix: function () {function fix(fixer) {
                      /** @type {import('eslint').Rule.Fix[]} */
                      var fixes = [];

                      // if there are no value specifiers, then the other report fixer will be called, not this one

                      if (valueSpecifiers.length > 0) {
                        // import { Value, type Type } from 'mod';

                        // we can just remove the type specifiers
                        removeSpecifiers(fixes, fixer, sourceCode, typeSpecifiers);
                        removeSpecifiers(fixes, fixer, sourceCode, typeofSpecifiers);

                        // make the import nicely formatted by also removing the trailing comma after the last value import
                        // eg
                        // import { Value, type Type } from 'mod';
                        // to
                        // import { Value  } from 'mod';
                        // not
                        // import { Value,  } from 'mod';
                        var maybeComma = sourceCode.getTokenAfter(valueSpecifiers[valueSpecifiers.length - 1]);
                        if (isComma(maybeComma)) {
                          fixes.push(fixer.remove(maybeComma));
                        }
                      } else if (defaultSpecifier) {
                        // import Default, { type Type } from 'mod';

                        // remove the entire curly block so we don't leave an empty one behind
                        // NOTE - the default specifier *must* be the first specifier always!
                        //        so a comma exists that we also have to clean up or else it's bad syntax
                        var comma = sourceCode.getTokenAfter(defaultSpecifier, isComma);
                        var closingBrace = sourceCode.getTokenAfter(
                        node.specifiers[node.specifiers.length - 1],
                        function (token) {return token.type === 'Punctuator' && token.value === '}';});

                        fixes.push(fixer.removeRange([
                        comma.range[0],
                        closingBrace.range[1]]));

                      }

                      return fixes.concat(
                      // insert the new imports after the old declaration
                      fixer.insertTextAfter(node, '\n' + String(newImports)));

                    }return fix;}() });

              });
            }
          }return ImportDeclaration;}() };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9jb25zaXN0ZW50LXR5cGUtc3BlY2lmaWVyLXN0eWxlLmpzIl0sIm5hbWVzIjpbImlzQ29tbWEiLCJ0b2tlbiIsInR5cGUiLCJ2YWx1ZSIsInJlbW92ZVNwZWNpZmllcnMiLCJmaXhlcyIsImZpeGVyIiwic291cmNlQ29kZSIsInNwZWNpZmllcnMiLCJzcGVjaWZpZXIiLCJnZXRUb2tlbkFmdGVyIiwicHVzaCIsInJlbW92ZSIsImdldEltcG9ydFRleHQiLCJub2RlIiwia2luZCIsInNvdXJjZVN0cmluZyIsImdldFRleHQiLCJzb3VyY2UiLCJsZW5ndGgiLCJuYW1lcyIsIm1hcCIsInMiLCJpbXBvcnRlZCIsIm5hbWUiLCJsb2NhbCIsImpvaW4iLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJjYXRlZ29yeSIsImRlc2NyaXB0aW9uIiwidXJsIiwiZml4YWJsZSIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJwcmVmZXJlbmNlIiwib3B0aW9ucyIsIkltcG9ydERlY2xhcmF0aW9uIiwiaW1wb3J0S2luZCIsInJlcG9ydCIsIm1lc3NhZ2UiLCJkYXRhIiwiZml4Iiwia2luZFRva2VuIiwiZ2V0Rmlyc3RUb2tlbiIsInNraXAiLCJjb25jYXQiLCJpbnNlcnRUZXh0QmVmb3JlIiwidHlwZVNwZWNpZmllcnMiLCJ0eXBlb2ZTcGVjaWZpZXJzIiwidmFsdWVTcGVjaWZpZXJzIiwiZGVmYXVsdFNwZWNpZmllciIsInR5cGVJbXBvcnQiLCJ0eXBlb2ZJbXBvcnQiLCJuZXdJbXBvcnRzIiwidHJpbSIsIm1lc3NhZ2VTdWZmaXgiLCJyZXBsYWNlVGV4dCIsImZvckVhY2giLCJtYXliZUNvbW1hIiwiY29tbWEiLCJjbG9zaW5nQnJhY2UiLCJyZW1vdmVSYW5nZSIsInJhbmdlIiwiaW5zZXJ0VGV4dEFmdGVyIl0sIm1hcHBpbmdzIjoiYUFBQTs7QUFFQSxxQzs7QUFFQSxTQUFTQSxPQUFULENBQWlCQyxLQUFqQixFQUF3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Rix1QkFsQkQsTUFrQk8sSUFBSVIsZ0JBQUosRUFBc0I7QUFDM0I7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsNEJBQU1TLFFBQVF4RCxXQUFXRyxhQUFYLENBQXlCNEMsZ0JBQXpCLEVBQTJDdEQsT0FBM0MsQ0FBZDtBQUNBLDRCQUFNZ0UsZUFBZXpELFdBQVdHLGFBQVg7QUFDbkJJLDZCQUFLTixVQUFMLENBQWdCTSxLQUFLTixVQUFMLENBQWdCVyxNQUFoQixHQUF5QixDQUF6QyxDQURtQjtBQUVuQixrQ0FBQ2xCLEtBQUQsVUFBV0EsTUFBTUMsSUFBTixLQUFlLFlBQWYsSUFBK0JELE1BQU1FLEtBQU4sS0FBZ0IsR0FBMUQsRUFGbUIsQ0FBckI7O0FBSUFFLDhCQUFNTSxJQUFOLENBQVdMLE1BQU0yRCxXQUFOLENBQWtCO0FBQzNCRiw4QkFBTUcsS0FBTixDQUFZLENBQVosQ0FEMkI7QUFFM0JGLHFDQUFhRSxLQUFiLENBQW1CLENBQW5CLENBRjJCLENBQWxCLENBQVg7O0FBSUQ7O0FBRUQsNkJBQU83RCxNQUFNNEMsTUFBTjtBQUNMO0FBQ0EzQyw0QkFBTTZELGVBQU4sQ0FBc0JyRCxJQUF0QixnQkFBaUMyQyxVQUFqQyxFQUZLLENBQVA7O0FBSUQscUJBbkRZLGdCQUFmOztBQXFERCxlQXRERDtBQXVERDtBQUNGLFdBNUhJLDhCQUFQOztBQThIRCxLQWxNYyxtQkFBakIiLCJmaWxlIjoiY29uc2lzdGVudC10eXBlLXNwZWNpZmllci1zdHlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldFNvdXJjZUNvZGUgfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2NvbnRleHRDb21wYXQnO1xuXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuZnVuY3Rpb24gaXNDb21tYSh0b2tlbikge1xuICByZXR1cm4gdG9rZW4udHlwZSA9PT0gJ1B1bmN0dWF0b3InICYmIHRva2VuLnZhbHVlID09PSAnLCc7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ2VzbGludCcpLlJ1bGUuRml4W119IGZpeGVzXG4gKiBAcGFyYW0ge2ltcG9ydCgnZXNsaW50JykuUnVsZS5SdWxlRml4ZXJ9IGZpeGVyXG4gKiBAcGFyYW0ge2ltcG9ydCgnZXNsaW50JykuU291cmNlQ29kZS5Tb3VyY2VDb2RlfSBzb3VyY2VDb2RlXG4gKiBAcGFyYW0geyhJbXBvcnRTcGVjaWZpZXIgfCBJbXBvcnREZWZhdWx0U3BlY2lmaWVyIHwgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyKVtdfSBzcGVjaWZpZXJzXG4gKiAqL1xuZnVuY3Rpb24gcmVtb3ZlU3BlY2lmaWVycyhmaXhlcywgZml4ZXIsIHNvdXJjZUNvZGUsIHNwZWNpZmllcnMpIHtcbiAgZm9yIChjb25zdCBzcGVjaWZpZXIgb2Ygc3BlY2lmaWVycykge1xuICAgIC8vIHJlbW92ZSB0aGUgdHJhaWxpbmcgY29tbWFcbiAgICBjb25zdCB0b2tlbiA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5BZnRlcihzcGVjaWZpZXIpO1xuICAgIGlmICh0b2tlbiAmJiBpc0NvbW1hKHRva2VuKSkge1xuICAgICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmUodG9rZW4pKTtcbiAgICB9XG4gICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmUoc3BlY2lmaWVyKSk7XG4gIH1cbn1cblxuLyoqIEB0eXBlIHsobm9kZTogaW1wb3J0KCdlc3RyZWUnKS5Ob2RlLCBzb3VyY2VDb2RlOiBpbXBvcnQoJ2VzbGludCcpLlNvdXJjZUNvZGUuU291cmNlQ29kZSwgc3BlY2lmaWVyczogKEltcG9ydFNwZWNpZmllciB8IEltcG9ydE5hbWVzcGFjZVNwZWNpZmllcilbXSwga2luZDogJ3R5cGUnIHwgJ3R5cGVvZicpID0+IHN0cmluZ30gKi9cbmZ1bmN0aW9uIGdldEltcG9ydFRleHQoXG4gIG5vZGUsXG4gIHNvdXJjZUNvZGUsXG4gIHNwZWNpZmllcnMsXG4gIGtpbmQsXG4pIHtcbiAgY29uc3Qgc291cmNlU3RyaW5nID0gc291cmNlQ29kZS5nZXRUZXh0KG5vZGUuc291cmNlKTtcbiAgaWYgKHNwZWNpZmllcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgY29uc3QgbmFtZXMgPSBzcGVjaWZpZXJzLm1hcCgocykgPT4ge1xuICAgIGlmIChzLmltcG9ydGVkLm5hbWUgPT09IHMubG9jYWwubmFtZSkge1xuICAgICAgcmV0dXJuIHMuaW1wb3J0ZWQubmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIGAke3MuaW1wb3J0ZWQubmFtZX0gYXMgJHtzLmxvY2FsLm5hbWV9YDtcbiAgfSk7XG4gIC8vIGluc2VydCBhIGZyZXNoIHRvcC1sZXZlbCBpbXBvcnRcbiAgcmV0dXJuIGBpbXBvcnQgJHtraW5kfSB7JHtuYW1lcy5qb2luKCcsICcpfX0gZnJvbSAke3NvdXJjZVN0cmluZ307YDtcbn1cblxuLyoqIEB0eXBlIHtpbXBvcnQoJ2VzbGludCcpLlJ1bGUuUnVsZU1vZHVsZX0gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIGNhdGVnb3J5OiAnU3R5bGUgZ3VpZGUnLFxuICAgICAgZGVzY3JpcHRpb246ICdFbmZvcmNlIG9yIGJhbiB0aGUgdXNlIG9mIGlubGluZSB0eXBlLW9ubHkgbWFya2VycyBmb3IgbmFtZWQgaW1wb3J0cy4nLFxuICAgICAgdXJsOiBkb2NzVXJsKCdjb25zaXN0ZW50LXR5cGUtc3BlY2lmaWVyLXN0eWxlJyksXG4gICAgfSxcbiAgICBmaXhhYmxlOiAnY29kZScsXG4gICAgc2NoZW1hOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBlbnVtOiBbXG4gICAgICAgICAgJ3ByZWZlci1pbmxpbmUnLFxuICAgICAgICAgICdwcmVmZXItdG9wLWxldmVsJyxcbiAgICAgICAgICAncHJlZmVyLXRvcC1sZXZlbC1pZi1vbmx5LXR5cGUtaW1wb3J0cycsXG4gICAgICAgIF0sXG4gICAgICAgIGRlZmF1bHQ6ICdwcmVmZXItaW5saW5lJyxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGUoY29udGV4dCkge1xuICAgIGNvbnN0IHNvdXJjZUNvZGUgPSBnZXRTb3VyY2VDb2RlKGNvbnRleHQpO1xuICAgIGNvbnN0IHByZWZlcmVuY2UgPSBjb250ZXh0Lm9wdGlvbnNbMF07XG5cbiAgICBpZiAocHJlZmVyZW5jZSA9PT0gJ3ByZWZlci1pbmxpbmUnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgICAgaWYgKG5vZGUuaW1wb3J0S2luZCA9PT0gJ3ZhbHVlJyB8fCBub2RlLmltcG9ydEtpbmQgPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gdG9wLWxldmVsIHZhbHVlIC8gdW5rbm93biBpcyB2YWxpZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIC8vIG5vIHNwZWNpZmllcnMgKGltcG9ydCB0eXBlIHt9IGZyb20gJycpIGhhdmUgbm8gc3BlY2lmaWVycyB0byBtYXJrIGFzIGlubGluZVxuICAgICAgICAgICAgbm9kZS5zcGVjaWZpZXJzLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgfHwgbm9kZS5zcGVjaWZpZXJzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgICAvLyBkZWZhdWx0IGltcG9ydHMgYXJlIGJvdGggXCJpbmxpbmVcIiBhbmQgXCJ0b3AtbGV2ZWxcIlxuICAgICAgICAgICAgJiYgKFxuICAgICAgICAgICAgICBub2RlLnNwZWNpZmllcnNbMF0udHlwZSA9PT0gJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInXG4gICAgICAgICAgICAgICAgLy8gbmFtZXNwYWNlIGltcG9ydHMgYXJlIGJvdGggXCJpbmxpbmVcIiBhbmQgXCJ0b3AtbGV2ZWxcIlxuICAgICAgICAgICAgICAgIHx8IG5vZGUuc3BlY2lmaWVyc1swXS50eXBlID09PSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJ1xuICAgICAgICAgICAgKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmVyIHVzaW5nIGlubGluZSB7e2tpbmR9fSBzcGVjaWZpZXJzIGluc3RlYWQgb2YgYSB0b3AtbGV2ZWwge3traW5kfX0tb25seSBpbXBvcnQuJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAga2luZDogbm9kZS5pbXBvcnRLaW5kLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpeChmaXhlcikge1xuICAgICAgICAgICAgICBjb25zdCBraW5kVG9rZW4gPSBzb3VyY2VDb2RlLmdldEZpcnN0VG9rZW4obm9kZSwgeyBza2lwOiAxIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQoXG4gICAgICAgICAgICAgICAga2luZFRva2VuID8gZml4ZXIucmVtb3ZlKGtpbmRUb2tlbikgOiBbXSxcbiAgICAgICAgICAgICAgICBub2RlLnNwZWNpZmllcnMubWFwKChzcGVjaWZpZXIpID0+IGZpeGVyLmluc2VydFRleHRCZWZvcmUoc3BlY2lmaWVyLCBgJHtub2RlLmltcG9ydEtpbmR9IGApKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHByZWZlci10b3AtbGV2ZWwgb3IgcHJlZmVyLXRvcC1sZXZlbC1pZi1vbmx5LXR5cGUtaW1wb3J0c1xuICAgIHJldHVybiB7XG4gICAgICAvKiogQHBhcmFtIHtpbXBvcnQoJ2VzdHJlZScpLkltcG9ydERlY2xhcmF0aW9ufSBub2RlICovXG4gICAgICBJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAvLyBhbHJlYWR5IHRvcC1sZXZlbCBpcyB2YWxpZFxuICAgICAgICAgIG5vZGUuaW1wb3J0S2luZCA9PT0gJ3R5cGUnXG4gICAgICAgICAgfHwgbm9kZS5pbXBvcnRLaW5kID09PSAndHlwZW9mJ1xuICAgICAgICAgIC8vIG5vIHNwZWNpZmllcnMgKGltcG9ydCB7fSBmcm9tICcnKSBjYW5ub3QgaGF2ZSBpbmxpbmUgLSBzbyBpcyB2YWxpZFxuICAgICAgICAgIHx8IG5vZGUuc3BlY2lmaWVycy5sZW5ndGggPT09IDBcbiAgICAgICAgICB8fCBub2RlLnNwZWNpZmllcnMubGVuZ3RoID09PSAxXG4gICAgICAgICAgLy8gZGVmYXVsdCBpbXBvcnRzIGFyZSBib3RoIFwiaW5saW5lXCIgYW5kIFwidG9wLWxldmVsXCJcbiAgICAgICAgICAmJiAoXG4gICAgICAgICAgICBub2RlLnNwZWNpZmllcnNbMF0udHlwZSA9PT0gJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInXG4gICAgICAgICAgICAvLyBuYW1lc3BhY2UgaW1wb3J0cyBhcmUgYm90aCBcImlubGluZVwiIGFuZCBcInRvcC1sZXZlbFwiXG4gICAgICAgICAgICB8fCBub2RlLnNwZWNpZmllcnNbMF0udHlwZSA9PT0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcidcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAdHlwZSB7dHlwZW9mIG5vZGUuc3BlY2lmaWVyc30gKi9cbiAgICAgICAgY29uc3QgdHlwZVNwZWNpZmllcnMgPSBbXTtcbiAgICAgICAgLyoqIEB0eXBlIHt0eXBlb2Ygbm9kZS5zcGVjaWZpZXJzfSAqL1xuICAgICAgICBjb25zdCB0eXBlb2ZTcGVjaWZpZXJzID0gW107XG4gICAgICAgIC8qKiBAdHlwZSB7dHlwZW9mIG5vZGUuc3BlY2lmaWVyc30gKi9cbiAgICAgICAgY29uc3QgdmFsdWVTcGVjaWZpZXJzID0gW107XG4gICAgICAgIC8qKiBAdHlwZSB7dHlwZW9mIG5vZGUuc3BlY2lmaWVyc1tudW1iZXJdfSAqL1xuICAgICAgICBsZXQgZGVmYXVsdFNwZWNpZmllciA9IG51bGw7XG4gICAgICAgIGZvciAoY29uc3Qgc3BlY2lmaWVyIG9mIG5vZGUuc3BlY2lmaWVycykge1xuICAgICAgICAgIGlmIChzcGVjaWZpZXIudHlwZSA9PT0gJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInKSB7XG4gICAgICAgICAgICBkZWZhdWx0U3BlY2lmaWVyID0gc3BlY2lmaWVyO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNwZWNpZmllci5pbXBvcnRLaW5kID09PSAndHlwZScpIHtcbiAgICAgICAgICAgIHR5cGVTcGVjaWZpZXJzLnB1c2goc3BlY2lmaWVyKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNwZWNpZmllci5pbXBvcnRLaW5kID09PSAndHlwZW9mJykge1xuICAgICAgICAgICAgdHlwZW9mU3BlY2lmaWVycy5wdXNoKHNwZWNpZmllcik7XG4gICAgICAgICAgfSBlbHNlIGlmIChzcGVjaWZpZXIuaW1wb3J0S2luZCA9PT0gJ3ZhbHVlJyB8fCBzcGVjaWZpZXIuaW1wb3J0S2luZCA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YWx1ZVNwZWNpZmllcnMucHVzaChzcGVjaWZpZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHR5cGVJbXBvcnQgPSBnZXRJbXBvcnRUZXh0KG5vZGUsIHNvdXJjZUNvZGUsIHR5cGVTcGVjaWZpZXJzLCAndHlwZScpO1xuICAgICAgICBjb25zdCB0eXBlb2ZJbXBvcnQgPSBnZXRJbXBvcnRUZXh0KG5vZGUsIHNvdXJjZUNvZGUsIHR5cGVvZlNwZWNpZmllcnMsICd0eXBlb2YnKTtcbiAgICAgICAgY29uc3QgbmV3SW1wb3J0cyA9IGAke3R5cGVJbXBvcnR9XFxuJHt0eXBlb2ZJbXBvcnR9YC50cmltKCk7XG5cbiAgICAgICAgaWYgKHR5cGVTcGVjaWZpZXJzLmxlbmd0aCArIHR5cGVvZlNwZWNpZmllcnMubGVuZ3RoID09PSBub2RlLnNwZWNpZmllcnMubGVuZ3RoKSB7XG4gICAgICAgICAgLyoqIEB0eXBlIHsoJ3R5cGUnIHwgJ3R5cGVvZicpW119ICovXG4gICAgICAgICAgLy8gYWxsIHNwZWNpZmllcnMgaGF2ZSBpbmxpbmUgc3BlY2lmaWVycyAtIHNvIHdlIHJlcGxhY2UgdGhlIGVudGlyZSBpbXBvcnRcbiAgICAgICAgICBjb25zdCBraW5kID0gW10uY29uY2F0KFxuICAgICAgICAgICAgdHlwZVNwZWNpZmllcnMubGVuZ3RoID4gMCA/ICd0eXBlJyA6IFtdLFxuICAgICAgICAgICAgdHlwZW9mU3BlY2lmaWVycy5sZW5ndGggPiAwID8gJ3R5cGVvZicgOiBbXSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgbWVzc2FnZVN1ZmZpeCA9IHByZWZlcmVuY2UgPT09ICdwcmVmZXItdG9wLWxldmVsLWlmLW9ubHktdHlwZS1pbXBvcnRzJyA/ICcgd2hlbiB0aGVyZSBhcmUgb25seSB0eXBlIGltcG9ydHMnIDogJyc7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBQcmVmZXIgdXNpbmcgYSB0b3AtbGV2ZWwge3traW5kfX0tb25seSBpbXBvcnQgaW5zdGVhZCBvZiBpbmxpbmUge3traW5kfX0gc3BlY2lmaWVycyR7bWVzc2FnZVN1ZmZpeH0uYCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAga2luZDoga2luZC5qb2luKCcvJyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZml4KGZpeGVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmaXhlci5yZXBsYWNlVGV4dChub2RlLCBuZXdJbXBvcnRzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJlZmVyZW5jZSAhPT0gJ3ByZWZlci10b3AtbGV2ZWwtaWYtb25seS10eXBlLWltcG9ydHMnKSB7XG4gICAgICAgICAgLy8gcmVtb3ZlIHNwZWNpZmljIHNwZWNpZmllcnMgYW5kIGluc2VydCBuZXcgaW1wb3J0cyBmb3IgdGhlbVxuICAgICAgICAgIHR5cGVTcGVjaWZpZXJzLmNvbmNhdCh0eXBlb2ZTcGVjaWZpZXJzKS5mb3JFYWNoKChzcGVjaWZpZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgbm9kZTogc3BlY2lmaWVyLFxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmVyIHVzaW5nIGEgdG9wLWxldmVsIHt7a2luZH19LW9ubHkgaW1wb3J0IGluc3RlYWQgb2YgaW5saW5lIHt7a2luZH19IHNwZWNpZmllcnMuJyxcbiAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGtpbmQ6IHNwZWNpZmllci5pbXBvcnRLaW5kLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmaXgoZml4ZXIpIHtcbiAgICAgICAgICAgICAgICAvKiogQHR5cGUge2ltcG9ydCgnZXNsaW50JykuUnVsZS5GaXhbXX0gKi9cbiAgICAgICAgICAgICAgICBjb25zdCBmaXhlcyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgYXJlIG5vIHZhbHVlIHNwZWNpZmllcnMsIHRoZW4gdGhlIG90aGVyIHJlcG9ydCBmaXhlciB3aWxsIGJlIGNhbGxlZCwgbm90IHRoaXMgb25lXG5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWVTcGVjaWZpZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIC8vIGltcG9ydCB7IFZhbHVlLCB0eXBlIFR5cGUgfSBmcm9tICdtb2QnO1xuXG4gICAgICAgICAgICAgICAgICAvLyB3ZSBjYW4ganVzdCByZW1vdmUgdGhlIHR5cGUgc3BlY2lmaWVyc1xuICAgICAgICAgICAgICAgICAgcmVtb3ZlU3BlY2lmaWVycyhmaXhlcywgZml4ZXIsIHNvdXJjZUNvZGUsIHR5cGVTcGVjaWZpZXJzKTtcbiAgICAgICAgICAgICAgICAgIHJlbW92ZVNwZWNpZmllcnMoZml4ZXMsIGZpeGVyLCBzb3VyY2VDb2RlLCB0eXBlb2ZTcGVjaWZpZXJzKTtcblxuICAgICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgaW1wb3J0IG5pY2VseSBmb3JtYXR0ZWQgYnkgYWxzbyByZW1vdmluZyB0aGUgdHJhaWxpbmcgY29tbWEgYWZ0ZXIgdGhlIGxhc3QgdmFsdWUgaW1wb3J0XG4gICAgICAgICAgICAgICAgICAvLyBlZ1xuICAgICAgICAgICAgICAgICAgLy8gaW1wb3J0IHsgVmFsdWUsIHR5cGUgVHlwZSB9IGZyb20gJ21vZCc7XG4gICAgICAgICAgICAgICAgICAvLyB0b1xuICAgICAgICAgICAgICAgICAgLy8gaW1wb3J0IHsgVmFsdWUgIH0gZnJvbSAnbW9kJztcbiAgICAgICAgICAgICAgICAgIC8vIG5vdFxuICAgICAgICAgICAgICAgICAgLy8gaW1wb3J0IHsgVmFsdWUsICB9IGZyb20gJ21vZCc7XG4gICAgICAgICAgICAgICAgICBjb25zdCBtYXliZUNvbW1hID0gc291cmNlQ29kZS5nZXRUb2tlbkFmdGVyKHZhbHVlU3BlY2lmaWVyc1t2YWx1ZVNwZWNpZmllcnMubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgICAgICAgICAgaWYgKGlzQ29tbWEobWF5YmVDb21tYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmUobWF5YmVDb21tYSkpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVmYXVsdFNwZWNpZmllcikge1xuICAgICAgICAgICAgICAgICAgLy8gaW1wb3J0IERlZmF1bHQsIHsgdHlwZSBUeXBlIH0gZnJvbSAnbW9kJztcblxuICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBlbnRpcmUgY3VybHkgYmxvY2sgc28gd2UgZG9uJ3QgbGVhdmUgYW4gZW1wdHkgb25lIGJlaGluZFxuICAgICAgICAgICAgICAgICAgLy8gTk9URSAtIHRoZSBkZWZhdWx0IHNwZWNpZmllciAqbXVzdCogYmUgdGhlIGZpcnN0IHNwZWNpZmllciBhbHdheXMhXG4gICAgICAgICAgICAgICAgICAvLyAgICAgICAgc28gYSBjb21tYSBleGlzdHMgdGhhdCB3ZSBhbHNvIGhhdmUgdG8gY2xlYW4gdXAgb3IgZWxzZSBpdCdzIGJhZCBzeW50YXhcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hID0gc291cmNlQ29kZS5nZXRUb2tlbkFmdGVyKGRlZmF1bHRTcGVjaWZpZXIsIGlzQ29tbWEpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgY2xvc2luZ0JyYWNlID0gc291cmNlQ29kZS5nZXRUb2tlbkFmdGVyKFxuICAgICAgICAgICAgICAgICAgICBub2RlLnNwZWNpZmllcnNbbm9kZS5zcGVjaWZpZXJzLmxlbmd0aCAtIDFdLFxuICAgICAgICAgICAgICAgICAgICAodG9rZW4pID0+IHRva2VuLnR5cGUgPT09ICdQdW5jdHVhdG9yJyAmJiB0b2tlbi52YWx1ZSA9PT0gJ30nLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGZpeGVzLnB1c2goZml4ZXIucmVtb3ZlUmFuZ2UoW1xuICAgICAgICAgICAgICAgICAgICBjb21tYS5yYW5nZVswXSxcbiAgICAgICAgICAgICAgICAgICAgY2xvc2luZ0JyYWNlLnJhbmdlWzFdLFxuICAgICAgICAgICAgICAgICAgXSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmaXhlcy5jb25jYXQoXG4gICAgICAgICAgICAgICAgICAvLyBpbnNlcnQgdGhlIG5ldyBpbXBvcnRzIGFmdGVyIHRoZSBvbGQgZGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICAgIGZpeGVyLmluc2VydFRleHRBZnRlcihub2RlLCBgXFxuJHtuZXdJbXBvcnRzfWApLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==