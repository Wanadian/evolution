/*
 * Copyright 2022, Polytechnique Montreal and contributors
 *
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */
import each from 'jest-each';
import i18n from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import { UserInterviewAttributes } from '../../services/interviews/interview';

import * as Helpers from '../helpers';

jest.mock('i18next', () => ({
    t: jest.fn(),
    language: 'en'
}));
const mockedT = i18n.t as jest.MockedFunction<typeof i18n.t>;

type CustomSurvey = {
    section1?: {
        q1?: string;
        q2?: number;
    };
    section2?: {
        q1?: string;
    }
}

const interviewAttributes: UserInterviewAttributes<CustomSurvey, unknown, unknown, unknown> = {
    id: 1,
    uuid: 'arbitrary uuid',
    participant_id: 1,
    is_completed: false,
    responses: {
        section1: {
            q1: 'abc',
            q2: 3
        },
        section2: {
            q1: 'test'
        }
    },
    validations: {
        section1: {
            q1: true,
            q2: false
        },
        section2: {
            q1: true
        }
    },
    is_valid: true
};

const userAttributes = {
    id: 1,
    username: 'foo',
    preferences: {  },
    serializedPermissions: [],
    isAuthorized: () => true,
    is_admin: false,
    pages: [],
    showUserInfo: true
};


const interviewAttributes2: UserInterviewAttributes<any, any, any, any> = {
    id: 1,
    uuid: 'arbitrary uuid',
    participant_id: 1,
    is_completed: false,
    responses: {
        section1: {
            q1: 'abc',
            q2: 3
        },
        section2: {
            q1: 'test'
        },
        household: {
            size: 1,
            persons: {
                personId1: {
                    _uuid: 'personId1'
                },
                personId2: {
                    _uuid: 'personId2'
                }
            }
        }
    },
    validations: {
        section1: {
            q1: true,
            q2: false
        },
        section2: {
            q1: true
        }
    },
    is_valid: true
};

const arbitraryFunction = jest.fn();
beforeEach(() => {
    mockedT.mockClear();
    arbitraryFunction.mockClear();
})

test('devLog', () => {
    // Not really a test, just make sure it does not throw
    Helpers.devLog({ a: 'foo' }, 3, 'evolution');
});

each([
    ['3', 'integer', 3],
    ['3.4', 'integer', 3],
    [3, 'integer', 3],
    [3.4, 'integer', 3],
    [null, 'integer', null],
    [undefined, 'integer', undefined],
    [[3], 'integer', undefined],
    [{ test: 3 }, 'integer', undefined],
    ['3', 'float', 3],
    ['3.4', 'float', 3.4],
    [3, 'float', 3],
    [3.4, 'float', 3.4],
    [null, 'float', null],
    [undefined, 'float', undefined],
    [[3], 'float', undefined],
    [{ test: 3 }, 'float', undefined],
    ['true', 'boolean', true],
    [true, 'boolean', true],
    ['f', 'boolean', false],
    [null, 'boolean', null],
    [undefined, 'boolean', undefined],
    [[3], 'boolean', null],
    [{ test: 3 }, 'boolean', null],
    ['test', 'string', 'test'],
    // TODO What about other data types? These are obviously not strings, see in the usage
    [[3, 4], 'string', [3, 4]],
    [{ test: 3 }, 'string', { test: 3 }],
    ['', 'object', null]
]).test('parseValue: %s %s', (value, type, expected) => {
    expect(Helpers.parseValue(value, type)).toEqual(expected);
});

each([
    [undefined, '../', null],
    [null, undefined, null],
    ['foo.bar.test', '.', null],
    ['foo.bar.test', 'notRelative', null],
    ['foo.bar.test', '../../myField', 'foo.myField'],
    ['foo.bar.test', '../../../myField', 'myField'],
    ['foo.bar.test', '../', 'foo.bar'],
    ['foo.bar.test', '../../../myField', 'myField'],
    ['foo.bar.test', '../../../../myField', 'myField'],
    ['foo.bar.test', '../../myField.abc', 'foo.myField.abc'],
    ['foo.bar.test', '../../../', null],
]).test('getPath: %s %s', (path, relativePath, expected) => {
    expect(Helpers.getPath(path, relativePath)).toEqual(expected);
});

test('getPath without relative path', () => {
    expect(Helpers.getPath(null)).toEqual(null);
    expect(Helpers.getPath(undefined)).toEqual(null);
    expect(Helpers.getPath('test')).toEqual('test');
});

each([
    ['section1.q1', 'def', undefined, (interviewAttributes2.responses.section1 as any).q1],
    ['section1.q3', 'def', undefined, 'def'],
    ['section1.q3', undefined, undefined, undefined],
    ['section1.q1', 'def', '../../section2.q1', (interviewAttributes2.responses.section2 as any).q1],
    ['section1.q1', 'def', 'section2.q1', null],
    ['section1', 'def', undefined, (interviewAttributes2.responses.section1 as any)],
]).test('getResponse: %s %s %s', (path, defaultValue, relativePath, expected) => {
    expect(Helpers.getResponse(interviewAttributes2, path, defaultValue, relativePath)).toEqual(expected);
});

each([
    ['section1.q1', 'def', undefined, 'section1.q1'],
    ['section1.q3', undefined, undefined, 'section1.q3'],
    ['section1.q1', [1, 2, 3], '../../section2.q1', 'section2.q1'],
    ['section1.q1.sq1', 'def', undefined, 'section1.q1.sq1'],
    ['section1.q1', 'def', 'section2.q1', 'section1.q1', 'abc']
]).test('setResponse: %s %s %s', (path, value, relativePath, finalPath, expected = undefined) => {
    const attributes = _cloneDeep(interviewAttributes2);
    Helpers.setResponse(attributes, path, value, relativePath);
    expect(Helpers.getResponse(attributes, finalPath)).toEqual(expected === undefined ? value : expected);
});

each([
    ['section1.q1', undefined, true],
    ['section1.q1', false, true],
    ['section1.q3', undefined, null],
    ['section1.q3', true, true],
    ['section1.q3', false, false],
    ['section1', undefined, null],
    ['section1', true, null],
    ['section1', false, null],
    ['section1.q2', undefined, false],
]).test('getValidation: %s %s %s', (path, defaultValue, expected) => {
    expect(Helpers.getValidation(interviewAttributes2, path, defaultValue)).toEqual(expected);
});

each([
    ['section1.q1', true, undefined, 'section1.q1'],
    ['section1.q3', false, undefined, 'section1.q3'],
    ['section1.q1', true, '../../section2.q1', 'section2.q1'],
    ['section1.q1.sq1.other', false, undefined, 'section1.q1.sq1.other'],
    ['section1.q1', false, 'section2.q1', 'section1.q1', true]
]).test('setValidation: %s %s %s', (path, value, relativePath, finalPath, expected = undefined) => {
    const attributes = _cloneDeep(interviewAttributes2);
    Helpers.setValidation(attributes, path, value, relativePath);
    expect(Helpers.getValidation(attributes, finalPath)).toEqual(expected === undefined ? value : expected);
});

each([
    [[], undefined],
    [[{ test: 'foo' }], undefined],
    [[{ test: 'foo' }, 'abc', true], 'abc'],
    [['1234 test street', 'H2R2B8'], '1234 test street, H2R2B8'],
    [['1234 test street', 'H2R2B8', 543], '1234 test street, H2R2B8, 543'],
    [['1234 test street', null], '1234 test street'],
]).test('formatGeocodingQueryStringFromMultipleFields: %s', (fields, expected) => {
    expect(Helpers.formatGeocodingQueryStringFromMultipleFields(fields)).toEqual(expected);
});

each([
    ['Has Household', interviewAttributes2.responses, interviewAttributes2.responses.household],
    ['Empty responses', {}, {}]
]).test('getHousehold: %s', (_title, responses, expected) => {
    const interview = _cloneDeep(interviewAttributes);
    interview.responses = responses;
    expect(Helpers.getHousehold(interview)).toEqual(expected);
});

each([
    ['Person 1', interviewAttributes2.responses, 'personId1', interviewAttributes2.responses.household.persons.personId1],
    ['Person 2', interviewAttributes2.responses, 'personId2', interviewAttributes2.responses.household.persons.personId2],
    ['Undefined active person', interviewAttributes2.responses, undefined, interviewAttributes2.responses.household.persons.personId1],
    ['Empty persons', { household: { ...interviewAttributes2.responses.household, persons: {} } }, 'personId1', {}],
    ['Empty household', { household: {} }, undefined, {}],
    ['Empty responses', {}, 'personId', {}]
]).test('getCurrentPerson: %s', (_title, responses, currentPersonId, expected) => {
    const interview = _cloneDeep(interviewAttributes2);
    interview.responses = responses;
    interview.responses._activePersonId = currentPersonId;
    expect(Helpers.getCurrentPerson(interview)).toEqual(expected);
});


test('parseString', () => {
    // Default string value
    expect(Helpers.parseString('test', interviewAttributes, 'some.path')).toEqual('test');
    // Undefined
    expect(Helpers.parseString(undefined, interviewAttributes, 'some.path')).toEqual(undefined);

    const parseFct = jest.fn().mockReturnValue('test');
    // With function, without user
    expect(Helpers.parseString(parseFct, interviewAttributes, 'some.path')).toEqual('test');
    expect(parseFct).toHaveBeenCalledTimes(1);
    expect(parseFct).toHaveBeenCalledWith(interviewAttributes, 'some.path', undefined);
    // With function and user
    expect(Helpers.parseString(parseFct, interviewAttributes, 'some.path', userAttributes )).toEqual('test');
    expect(parseFct).toHaveBeenCalledTimes(2);
    expect(parseFct).toHaveBeenCalledWith(interviewAttributes, 'some.path', userAttributes);
});

test('parseBoolean', () => {
    // boolean value
    expect(Helpers.parseBoolean(false, interviewAttributes, 'some.path')).toEqual(false);
    // Undefined or null, with or without default value
    expect(Helpers.parseBoolean(undefined, interviewAttributes, 'some.path')).toEqual(true);
    expect(Helpers.parseBoolean(null, interviewAttributes, 'some.path')).toEqual(true);
    expect(Helpers.parseBoolean(undefined, interviewAttributes, 'some.path', undefined, false)).toEqual(false);

    const parseFct = jest.fn().mockReturnValue(true);
    // With function, without user
    expect(Helpers.parseBoolean(parseFct, interviewAttributes, 'some.path')).toEqual(true);
    expect(parseFct).toHaveBeenCalledTimes(1);
    expect(parseFct).toHaveBeenCalledWith(interviewAttributes, 'some.path', undefined);
    // With function and user
    expect(Helpers.parseBoolean(parseFct, interviewAttributes, 'some.path', userAttributes)).toEqual(true);
    expect(parseFct).toHaveBeenCalledTimes(2);
    expect(parseFct).toHaveBeenLastCalledWith(interviewAttributes, 'some.path', userAttributes);
    // With array return value
    parseFct.mockReturnValueOnce([false, 'a']);
    expect(Helpers.parseBoolean(parseFct, interviewAttributes, 'some.path', userAttributes)).toEqual(false);
    expect(parseFct).toHaveBeenCalledTimes(3);
    expect(parseFct).toHaveBeenLastCalledWith(interviewAttributes, 'some.path', userAttributes);
});

test('parse', () => {
    const returnValue = { foo: 'bar' };

    // Default values of different types
    expect(Helpers.parse('test', interviewAttributes, 'some.path')).toEqual('test');
    expect(Helpers.parse(4, interviewAttributes, 'some.path')).toEqual(4);
    expect(Helpers.parse(returnValue, interviewAttributes, 'some.path')).toEqual(returnValue);
    // Undefined
    expect(Helpers.parse(undefined, interviewAttributes, 'some.path')).toEqual(undefined);

    const parseFct = jest.fn().mockReturnValue(returnValue);
    // With function, without user
    expect(Helpers.parse(parseFct, interviewAttributes, 'some.path')).toEqual(returnValue);
    expect(parseFct).toHaveBeenCalledTimes(1);
    expect(parseFct).toHaveBeenCalledWith(interviewAttributes, 'some.path', undefined);
    // With function and user
    expect(Helpers.parse(parseFct, interviewAttributes, 'some.path', userAttributes )).toEqual(returnValue);
    expect(parseFct).toHaveBeenCalledTimes(2);
    expect(parseFct).toHaveBeenCalledWith(interviewAttributes, 'some.path', userAttributes);
});

test('parseInteger', () => {
    // integer value
    expect(Helpers.parseInteger(3, interviewAttributes, 'some.path')).toEqual(3);
    // Undefined
    expect(Helpers.parseInteger(undefined, interviewAttributes, 'some.path')).toEqual(undefined);

    // parse function returns number
    const returnValue = 4;
    const parseFct = jest.fn().mockReturnValue(returnValue);
    // With function, without user
    expect(Helpers.parseInteger(parseFct, interviewAttributes, 'some.path')).toEqual(returnValue);
    expect(parseFct).toHaveBeenCalledTimes(1);
    expect(parseFct).toHaveBeenCalledWith(interviewAttributes, 'some.path', undefined);
    // With function and user
    expect(Helpers.parseInteger(parseFct, interviewAttributes, 'some.path', userAttributes)).toEqual(returnValue);
    expect(parseFct).toHaveBeenCalledTimes(2);
    expect(parseFct).toHaveBeenLastCalledWith(interviewAttributes, 'some.path', userAttributes);

    // parse function returns string
    const returnValueStr = '4';
    const parseFctStr = jest.fn().mockReturnValue(returnValueStr);
    // With function, without user
    expect(Helpers.parseInteger(parseFctStr, interviewAttributes, 'some.path')).toEqual(returnValue);
    expect(parseFctStr).toHaveBeenCalledTimes(1);
    expect(parseFctStr).toHaveBeenCalledWith(interviewAttributes, 'some.path', undefined);
    // With function and user
    expect(Helpers.parseInteger(parseFctStr, interviewAttributes, 'some.path', userAttributes)).toEqual(returnValue);
    expect(parseFctStr).toHaveBeenCalledTimes(2);
    expect(parseFctStr).toHaveBeenLastCalledWith(interviewAttributes, 'some.path', userAttributes);
});

each([
    ['Simple string', 'test', 'test', undefined],
    ['Object with simple strings', { en: 'english', fr: 'french' }, 'english', undefined],
    ['Object with parsed function', { en: arbitraryFunction.mockReturnValue('english'), fr: jest.fn().mockReturnValue('french') }, 'english', 'parseString'],
    ['TFunction', arbitraryFunction.mockReturnValue('english'), 'english', 'parseWithT'],
]).test('translate string: %s', (_title, toTranslate, expected, testCall?: 'parseString' | 'parseWithT') => {
    const path = 'some.path';
    expect(Helpers.translateString(toTranslate, i18n, interviewAttributes, path, userAttributes)).toEqual(expected);
    if (testCall === 'parseString') {
        expect(arbitraryFunction).toHaveBeenCalledWith(interviewAttributes, path, userAttributes);
    } else if (testCall === 'parseWithT') {
        expect(arbitraryFunction).toHaveBeenCalledWith(i18n.t, interviewAttributes, path, userAttributes);
    }
});

each([
    ['simple path', 'home.address', 'home.address'],
    ['single replacement for the whole string', '{section1.q1}', 'abc'],
    ['single replacement at the beginning', '{section1.q1}.something', 'abc.something'],
    ['single replacement at the end', 'something.{section1.q1}', 'something.abc'],
    ['single replacement in the middle', 'something.{section1.q2}.other', 'something.3.other'],
    ['replacement by an object response', 'something.{section1}.other', 'something.unknown.other'],
    ['many replacements with no dot after second', 'something.{section1.q1}.{section2.q1}other', 'something.abc.testother'],
    ['undefined replaced value', 'something.{section3.q1}.other', 'something.unknown.other'],
    ['bot defined and undefined replaced values', 'something.{section1.q1}.{section3.q1}.other', 'something.abc.unknown.other'],
]).test('interpolatePath, %s', (_title, path, expectedPath) => {
    expect(Helpers.interpolatePath(interviewAttributes, path)).toEqual(expectedPath);
});

each([
    ['Phone Number, 10-digit', '5141234567', true],
    ['Phone Number, spaces', '514 123 4567', true],
    ['Phone Number, more spaces', '514   123   4567', true],
    ['Phone Number, dashes', '514-123-4567', true],
    ['Phone Number, more dashes', '514---123---4567', true],
    ['Phone Number, dots', '514.123.4567', true],
    ['Phone Number, parenthesis & spaces', '(514) 123 4567', true],
    ['Phone Number, parenthesis & dash, dots', '(514)-123.4567', true],
    ['Phone Number, with prefix 11-digit', '15141234567', true],
    ['Phone Number, with prefix 12-digit', '125141234567', true],
    ['Phone Number, with prefix 13-digit', '1235141234567', true],
    ['Phone Number, plus prefix', '+1 5141234567', true],
    ['Phone Number, plus prefix & spaces', '+123 514 123 4567', true],
    ['Phone Number, plus prefix & dashes', '+123-514-123-4567', true],
    ['Phone Number, plus prefix & parenthesis & space, dash', '+123 (514) 123-4567', true],
    ['Phone Number, plus prefix & more dashes', '+123---514---123---4567', true],
    ['Phone Number, extension', '5141234567x1234', true],
    ['Phone Number, extension & spaces', '514 123 4567 x1234', true],
    ['Phone Number, extension & prefix', '1235141234567x1234', true],
    ['Phone Number, everything', '+123 (514)-123.4567 x1234', true],
    ['Not a Phone Number, letter', '514ABC4567', false],
    ['Not a Phone Number, too many numbers', '514 123456 789012345', false],
    ['Not a Phone Number, bad parenthesis', '(514)-(123)-(4567)', false],
    ['Not a Phone Number, invalid characters', '514/123/4567', false]
]).test('Is Phone Number? %s', (_title, phoneNumber, expected) => {
    expect(Helpers.isPhoneNumber(phoneNumber)).toEqual(expected);
});
