/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as LoginRouteImport } from './routes/login'
import { Route as AuthRouteImport } from './routes/_auth'
import { Route as AuthIndexRouteImport } from './routes/_auth/index'
import { Route as ShareThreadIdRouteImport } from './routes/share.$threadId'
import { Route as AuthSettingsRouteImport } from './routes/_auth/settings'
import { Route as AuthChatThreadIdRouteImport } from './routes/_auth/chat.$threadId'

const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthRoute = AuthRouteImport.update({
  id: '/_auth',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthIndexRoute = AuthIndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => AuthRoute,
} as any)
const ShareThreadIdRoute = ShareThreadIdRouteImport.update({
  id: '/share/$threadId',
  path: '/share/$threadId',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthSettingsRoute = AuthSettingsRouteImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => AuthRoute,
} as any)
const AuthChatThreadIdRoute = AuthChatThreadIdRouteImport.update({
  id: '/chat/$threadId',
  path: '/chat/$threadId',
  getParentRoute: () => AuthRoute,
} as any)

export interface FileRoutesByFullPath {
  '/login': typeof LoginRoute
  '/settings': typeof AuthSettingsRoute
  '/share/$threadId': typeof ShareThreadIdRoute
  '/': typeof AuthIndexRoute
  '/chat/$threadId': typeof AuthChatThreadIdRoute
}
export interface FileRoutesByTo {
  '/login': typeof LoginRoute
  '/settings': typeof AuthSettingsRoute
  '/share/$threadId': typeof ShareThreadIdRoute
  '/': typeof AuthIndexRoute
  '/chat/$threadId': typeof AuthChatThreadIdRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/_auth': typeof AuthRouteWithChildren
  '/login': typeof LoginRoute
  '/_auth/settings': typeof AuthSettingsRoute
  '/share/$threadId': typeof ShareThreadIdRoute
  '/_auth/': typeof AuthIndexRoute
  '/_auth/chat/$threadId': typeof AuthChatThreadIdRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/login'
    | '/settings'
    | '/share/$threadId'
    | '/'
    | '/chat/$threadId'
  fileRoutesByTo: FileRoutesByTo
  to: '/login' | '/settings' | '/share/$threadId' | '/' | '/chat/$threadId'
  id:
    | '__root__'
    | '/_auth'
    | '/login'
    | '/_auth/settings'
    | '/share/$threadId'
    | '/_auth/'
    | '/_auth/chat/$threadId'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  AuthRoute: typeof AuthRouteWithChildren
  LoginRoute: typeof LoginRoute
  ShareThreadIdRoute: typeof ShareThreadIdRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_auth': {
      id: '/_auth'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_auth/': {
      id: '/_auth/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof AuthIndexRouteImport
      parentRoute: typeof AuthRoute
    }
    '/share/$threadId': {
      id: '/share/$threadId'
      path: '/share/$threadId'
      fullPath: '/share/$threadId'
      preLoaderRoute: typeof ShareThreadIdRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_auth/settings': {
      id: '/_auth/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof AuthSettingsRouteImport
      parentRoute: typeof AuthRoute
    }
    '/_auth/chat/$threadId': {
      id: '/_auth/chat/$threadId'
      path: '/chat/$threadId'
      fullPath: '/chat/$threadId'
      preLoaderRoute: typeof AuthChatThreadIdRouteImport
      parentRoute: typeof AuthRoute
    }
  }
}

interface AuthRouteChildren {
  AuthSettingsRoute: typeof AuthSettingsRoute
  AuthIndexRoute: typeof AuthIndexRoute
  AuthChatThreadIdRoute: typeof AuthChatThreadIdRoute
}

const AuthRouteChildren: AuthRouteChildren = {
  AuthSettingsRoute: AuthSettingsRoute,
  AuthIndexRoute: AuthIndexRoute,
  AuthChatThreadIdRoute: AuthChatThreadIdRoute,
}

const AuthRouteWithChildren = AuthRoute._addFileChildren(AuthRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  AuthRoute: AuthRouteWithChildren,
  LoginRoute: LoginRoute,
  ShareThreadIdRoute: ShareThreadIdRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
