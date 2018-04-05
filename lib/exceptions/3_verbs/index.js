/*
MeCab groups the verbs with their endings thus we must search
their accemts and adjust the endings manually.

たべ＼る
*/

function handleHeibanVerb (word, result, accent, utilities) {
    return result;
}

function handleAccentedVerb (word, result, accent, utilities) {
    if (word.inflection == '連用形') {
        if (word.conjugation == '一段' ) {
            if (!utilities.isAtVoiclessVowel(result, accent - 1)) {
                // ツケ＼ル　⇨　ツケ＼テ
                accent = Math.max(1, accent - 1);
            }

            if (result.charAt(accent - 1) == 'ン') {
                // ゾンジ＼ル　⇨　ゾ＼ンジテ
                accent = Math.max(1, accent - 1);
            }
            result = utilities.insertJapanese(result, accent, '＼');
        } else if (word.conjugation.includes('五段')) {
            if (word.inflection == '連用形') {
                result = utilities.insertJapanese(result, accent, '＼');
            } else if (word.inflection == '未然形') {
                result = utilities.insertJapanese(result, result.length, '＼');
            }
        }
    } else if (word.inflection == '未然形') {
        if (word.conjugation == '一段') {
            result = utilities.insertJapanese(result, result.length, '＼');
        } else if (word.conjugation.includes('五段')) {
            result = utilities.insertJapanese(result, result.length, '＼');
        }
    }

    return result;
}

module.exports = (parser, utilities) => {
    if (!parser.textArray.length) {
        return 0;
    }

    var word = parser.textArray.shift();
    var nextWord = parser.textArray.shift();
    var foundException = false;

    if (word.lexical == '動詞' && word.inflection != '基本形') {
        utilities.parse(word.original, function (originalResult) {
            var result = word.pronunciation;

            var accent = originalResult.indexOf('＼');
            if (accent > 0) {
                // Has accent
                result = handleAccentedVerb(word, result, accent, utilities);
            } else {
                result = handleHeibanVerb(word, result, accent, utilities);
            }

            if (word.inflection == '未然形' && nextWord && nextWord.lexical == '助動詞' && nextWord.conjugation == '特殊・ナイ') {
                result += nextWord.pronunciation;
                nextWord.reading = result.replace('＼', '');
                nextWord.pronunciation = result;
                nextWord.result = result;
                word = false;
            }

            if (nextWord) {
                parser.textArray.unshift(nextWord);
            }

            if (word) {
                word.result = result;
                parser.insertResult(word);
            }
            parser.internalParse();
        });
        foundException = true;
    }

    if (!foundException) {
        if (nextWord) {
            parser.textArray.unshift(nextWord);
        }
        parser.textArray.unshift(word);
    }

    return foundException ? 1 : 0;
}