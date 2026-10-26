import { NextResponse } from "next/server";

export function s200(data?: unknown) {
    return NextResponse.json({
        data
    }, {
        status: 200
    })
}

export function s201(data?: unknown) {
    return NextResponse.json({
        data
    }, {
        status: 201
    })
}

export function s204() {
    return new NextResponse(null, { status: 204 })
}

export function s400(detail?: string) {
    return NextResponse.json({
        title: 'Bad Request',
        status: 400,
        detail: detail ?? 'Bad Request'
    }, {
        status: 400
    })
}

export function s401(detail?: string) {
    return NextResponse.json({
        title: 'Unauthorized',
        status: 401,
        detail: detail ?? 'Unauthorized'
    }, {
        status: 401
    })
}

export function s403(detail?: string) {
    return NextResponse.json({
        title: 'Forbidden',
        status: 403,
        detail: detail ?? 'Forbidden'
    }, {
        status: 403
    })
}

export function s404(detail?: string) {
    return NextResponse.json({
        title: 'Not Found',
        status: 404,
        detail: detail ?? 'Not Found'
    }, {
        status: 404
    })
}

export function s409(detail?: string) {
    return NextResponse.json({
        title: 'Conflict',
        status: 409,
        detail: detail ?? 'Conflict'
    }, {
        status: 409
    })
}

export function s500(detail?: string) {
    return NextResponse.json({
        title: 'Internal Server Error',
        status: 500,
        detail: detail ?? 'Internal Server Error'
    }, {
        status: 500
    })
}