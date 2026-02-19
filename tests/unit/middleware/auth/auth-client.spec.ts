
import {
    checkIfValidSession,
    login,
    logout,
    redirect,
} from "#src/middleware/auth/auth-handlers.js";
import { stubObject, stubInterface } from "ts-sinon";
import sinon from "sinon";
import { strict as assert } from "node:assert";
import type { Request, Response } from "express";

import msalClient from "#src/middleware/auth/auth-client.js";
import config from "#config.js";

describe("checkAuthToken", () => {
    const response = { redirect: () => undefined } as unknown as Response;
    const nextHolder = { next: () => null };
    const verifyTokenStub: () => Promise<boolean> = async () =>
        await new Promise<boolean>((resolve) => {
            resolve(true);
        });
    it("should redirect unauthenticated users to the auth/login page if they try to hit a authenticated endpoint", async () => {
        const requestStub = stubObject({ path: "", session: {} }) as Request;
        const resStub = stubObject(response, { redirect: undefined });
        const nextStub = stubObject(nextHolder, { next: null });

        await checkIfValidSession(
            requestStub,
            resStub,
            nextStub.next,
            verifyTokenStub,
        );

        assert.equal(resStub.redirect.callCount, 1);
        assert.equal(resStub.redirect.firstCall.args[0], "/auth/login");
        assert.equal(nextStub.next.callCount, 0);
    });

    it("should allow authenticated users to access requested endpoint", async () => {
        const requestStub = stubObject({
            path: "",
            session: { idToken: "some-token" },
        }) as Request;
        const nextStub = stubObject(nextHolder, { next: null });
        const resStub = stubObject(response, { redirect: undefined });

        await checkIfValidSession(
            requestStub,
            resStub,
            nextStub.next,
            verifyTokenStub,
        );
        assert.equal(resStub.redirect.callCount, 0);
        assert.equal(nextStub.next.callCount, 1);
    });

    it("should redirect users with invalid token to the login page", async () => {
        const verifyTokenStub: () => Promise<boolean> = async () =>
        await new Promise<boolean>((resolve) => {
            resolve(false);
        });
        const requestStub = stubObject({
            path: "",
            session: { idToken: "some-token" },
        }) as Request;
        const nextStub = stubObject(nextHolder, { next: null });
        const resStub = stubObject(response, { redirect: undefined });

        await checkIfValidSession(
            requestStub,
            resStub,
            nextStub.next,
            verifyTokenStub,
        );
        assert.equal(resStub.redirect.callCount, 1);
        assert.equal(resStub.redirect.firstCall.args[0], "/auth/login");
        assert.equal(nextStub.next.callCount, 0);
    });

    it("should not authenticate on mock-data endpoints", async () => {
        const requestStub = stubObject({
            path: "/mock-data",
            session: {},
        }) as Request;
        const resStub = stubObject(response, { redirect: undefined });
        const nextStub = stubObject(nextHolder, { next: null });
        await checkIfValidSession(
            requestStub,
            resStub,
            nextStub.next,
            verifyTokenStub,
        );
        assert.equal(resStub.redirect.callCount, 0);
        assert.equal(nextStub.next.callCount, 1);
    });
});