import type { McpServerRequest, McpServerResponse, Env } from './index';

// Simulated file system structure stored in KV
interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: Record<string, FileSystemNode>;
  metadata?: {
    size?: number;
    created?: number;
    modified?: number;
    mime?: string;
  };
}

// Argument interfaces for filesystem operations
interface ReadFileArgs {
  path: string;
}

interface ListDirectoryArgs {
  path: string;
}

interface SearchFilesArgs {
  path: string;
  pattern: string;
  excludePatterns?: string[];
}

interface DirectoryTreeResult {
  name: string;
  type: 'file' | 'directory';
  children?: DirectoryTreeResult[];
}

// Root path for simulated filesystem
const ROOT_PATH = '/Users/joe/Projects/Personal/ContinentalUSA';

// KV namespace key for filesystem (reserved for future use)
// const FS_KV_KEY = 'FILESYSTEM_DATA';

/**
 * Handle filesystem MCP requests
 */
export async function handleFileSystem(
  request: McpServerRequest,
  env: Env
): Promise<McpServerResponse> {
  switch (request.method) {
    case 'listTools':
      return handleListTools(request);
    case 'callTool':
      return handleCallTool(request, env);
    default:
      return {
        error: {
          code: 404,
          message: `Method not found: ${request.method}`
        },
        id: request.id
      };
  }
}

/**
 * Handle listing available tools
 */
function handleListTools(request: McpServerRequest): McpServerResponse {
  return {
    result: {
      tools: [
        {
          name: 'read_file',
          description: 'Read the complete contents of a file from the file system.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string'
              }
            },
            required: ['path'],
            additionalProperties: false
          }
        },
        {
          name: 'list_directory',
          description: 'Get a detailed listing of all files and directories in a specified path.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string'
              }
            },
            required: ['path'],
            additionalProperties: false
          }
        },
        {
          name: 'directory_tree',
          description: 'Get a recursive tree view of files and directories as a JSON structure.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string'
              }
            },
            required: ['path'],
            additionalProperties: false
          }
        },
        {
          name: 'search_files',
          description: 'Recursively search for files and directories matching a pattern.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string'
              },
              pattern: {
                type: 'string'
              },
              excludePatterns: {
                type: 'array',
                items: {
                  type: 'string'
                },
                default: []
              }
            },
            required: ['path', 'pattern'],
            additionalProperties: false
          }
        },
        {
          name: 'list_allowed_directories',
          description: 'Returns the list of directories that this server is allowed to access.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    },
    id: request.id
  };
}

/**
 * Handle calling a filesystem tool
 */
async function handleCallTool(
  request: McpServerRequest,
  env: Env
): Promise<McpServerResponse> {
  const { name, arguments: args } = request.params;
  
  // Get filesystem data from KV
  const fsData = await getFileSystemData(env);
  
  switch (name) {
    case 'read_file':
      if (!isReadFileArgs(args)) {
        return createError(request.id, -32602, 'Invalid arguments for read_file');
      }
      return handleReadFile(args, fsData, request.id);
    case 'list_directory':
      if (!isListDirectoryArgs(args)) {
        return createError(request.id, -32602, 'Invalid arguments for list_directory');
      }
      return handleListDirectory(args, fsData, request.id);
    case 'directory_tree':
      if (!isListDirectoryArgs(args)) {
        return createError(request.id, -32602, 'Invalid arguments for directory_tree');
      }
      return handleDirectoryTree(args, fsData, request.id);
    case 'search_files':
      if (!isSearchFilesArgs(args)) {
        return createError(request.id, -32602, 'Invalid arguments for search_files');
      }
      return handleSearchFiles(args, fsData, request.id);
    case 'list_allowed_directories':
      return handleListAllowedDirectories(request.id);
    default:
      return {
        error: {
          code: 404,
          message: `Tool not found: ${name}`
        },
        id: request.id
      };
  }
}

/**
 * Get filesystem data from KV
 */
async function getFileSystemData(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _env: Env
): Promise<FileSystemNode> {
  try {
    // In a real implementation, this would fetch from KV
    // For demo purposes, we return a simulated filesystem
    return {
      name: 'ContinentalUSA',
      type: 'directory',
      children: {
        'docs': {
          name: 'docs',
          type: 'directory',
          children: {
            'PROJECT_OVERVIEW.md': {
              name: 'PROJECT_OVERVIEW.md',
              type: 'file',
              content: '# 48 Continental USA\nProject overview and documentation...',
              metadata: {
                size: 1024,
                created: Date.now() - 30 * 24 * 60 * 60 * 1000,
                modified: Date.now() - 2 * 24 * 60 * 60 * 1000,
                mime: 'text/markdown'
              }
            },
            'DEPLOYMENT_STRATEGY.md': {
              name: 'DEPLOYMENT_STRATEGY.md',
              type: 'file',
              content: '# Deployment Strategy\nThis document outlines how the 48 Continental USA project is deployed...',
              metadata: {
                size: 2048,
                created: Date.now() - 20 * 24 * 60 * 60 * 1000,
                modified: Date.now() - 1 * 24 * 60 * 60 * 1000,
                mime: 'text/markdown'
              }
            }
          }
        },
        'edge-worker': {
          name: 'edge-worker',
          type: 'directory',
          children: {
            'src': {
              name: 'src',
              type: 'directory',
              children: {
                'index.ts': {
                  name: 'index.ts',
                  type: 'file',
                  content: '// Main edge worker code...',
                  metadata: {
                    size: 4096,
                    created: Date.now() - 10 * 24 * 60 * 60 * 1000,
                    modified: Date.now() - 1 * 24 * 60 * 60 * 1000,
                    mime: 'text/typescript'
                  }
                }
              }
            },
            'wrangler.toml': {
              name: 'wrangler.toml',
              type: 'file',
              content: 'name = "thewanderingwhittle-edge"\ncompatibility_date = "2025-05-31"',
              metadata: {
                size: 512,
                created: Date.now() - 15 * 24 * 60 * 60 * 1000,
                modified: Date.now() - 5 * 24 * 60 * 60 * 1000,
                mime: 'text/toml'
              }
            }
          }
        }
      }
    };
  } catch (error) {
    console.error('Error getting filesystem data:', error);
    return {
      name: 'ContinentalUSA',
      type: 'directory',
      children: {}
    };
  }
}

/**
 * Handle read_file tool
 */
function handleReadFile(
  args: ReadFileArgs,
  fsData: FileSystemNode,
  requestId: string | undefined
): McpServerResponse {
  if (!args.path) {
    return {
      error: {
        code: 400,
        message: 'Missing required parameter: path'
      },
      id: requestId
    };
  }

  try {
    const normalizedPath = normalizePath(args.path);
    const node = findNodeByPath(fsData, normalizedPath);
    
    if (!node) {
      return {
        error: {
          code: 404,
          message: `File not found: ${args.path}`
        },
        id: requestId
      };
    }
    
    if (node.type !== 'file') {
      return {
        error: {
          code: 400,
          message: `Path is not a file: ${args.path}`
        },
        id: requestId
      };
    }
    
    return {
      result: node.content || '',
      id: requestId
    };
  } catch (error) {
    return {
      error: {
        code: 500,
        message: `Error reading file: ${String(error)}`
      },
      id: requestId
    };
  }
}

/**
 * Handle list_directory tool
 */
function handleListDirectory(
  args: ListDirectoryArgs,
  fsData: FileSystemNode,
  requestId: string | undefined
): McpServerResponse {
  if (!args.path) {
    return {
      error: {
        code: 400,
        message: 'Missing required parameter: path'
      },
      id: requestId
    };
  }

  try {
    const normalizedPath = normalizePath(args.path);
    const node = findNodeByPath(fsData, normalizedPath);
    
    if (!node) {
      return {
        error: {
          code: 404,
          message: `Directory not found: ${args.path}`
        },
        id: requestId
      };
    }
    
    if (node.type !== 'directory') {
      return {
        error: {
          code: 400,
          message: `Path is not a directory: ${args.path}`
        },
        id: requestId
      };
    }
    
    const listing = Object.values(node.children || {}).map(child => {
      return `[${child.type.toUpperCase()}] ${child.name}`;
    });
    
    return {
      result: listing,
      id: requestId
    };
  } catch (error) {
    return {
      error: {
        code: 500,
        message: `Error listing directory: ${String(error)}`
      },
      id: requestId
    };
  }
}

/**
 * Handle directory_tree tool
 */
function handleDirectoryTree(
  args: ListDirectoryArgs,
  fsData: FileSystemNode,
  requestId: string | undefined
): McpServerResponse {
  if (!args.path) {
    return {
      error: {
        code: 400,
        message: 'Missing required parameter: path'
      },
      id: requestId
    };
  }

  try {
    const normalizedPath = normalizePath(args.path);
    const node = findNodeByPath(fsData, normalizedPath);
    
    if (!node) {
      return {
        error: {
          code: 404,
          message: `Directory not found: ${args.path}`
        },
        id: requestId
      };
    }
    
    if (node.type !== 'directory') {
      return {
        error: {
          code: 400,
          message: `Path is not a directory: ${args.path}`
        },
        id: requestId
      };
    }
    
    const tree = buildDirectoryTree(node);
    
    return {
      result: tree,
      id: requestId
    };
  } catch (error) {
    return {
      error: {
        code: 500,
        message: `Error building directory tree: ${String(error)}`
      },
      id: requestId
    };
  }
}

/**
 * Handle search_files tool
 */
function handleSearchFiles(
  args: SearchFilesArgs,
  fsData: FileSystemNode,
  requestId: string | undefined
): McpServerResponse {
  if (!args.path || !args.pattern) {
    return {
      error: {
        code: 400,
        message: 'Missing required parameters: path and pattern'
      },
      id: requestId
    };
  }

  try {
    const normalizedPath = normalizePath(args.path);
    const node = findNodeByPath(fsData, normalizedPath);
    
    if (!node) {
      return {
        error: {
          code: 404,
          message: `Directory not found: ${args.path}`
        },
        id: requestId
      };
    }
    
    if (node.type !== 'directory') {
      return {
        error: {
          code: 400,
          message: `Path is not a directory: ${args.path}`
        },
        id: requestId
      };
    }
    
    const pattern = new RegExp(args.pattern, 'i');
    const excludePatterns = (args.excludePatterns || []).map((p: string) => new RegExp(p, 'i'));
    const results = searchFiles(node, pattern, excludePatterns, normalizedPath);
    
    return {
      result: results,
      id: requestId
    };
  } catch (error) {
    return {
      error: {
        code: 500,
        message: `Error searching files: ${String(error)}`
      },
      id: requestId
    };
  }
}

/**
 * Handle list_allowed_directories tool
 */
function handleListAllowedDirectories(requestId: string | undefined): McpServerResponse {
  return {
    result: [ROOT_PATH],
    id: requestId
  };
}

/**
 * Normalize a file path
 */
function normalizePath(path: string): string {
  // Convert to absolute path if it's not already
  if (!path.startsWith('/')) {
    path = `${ROOT_PATH}/${path}`;
  }
  
  // Remove trailing slash
  if (path.endsWith('/') && path !== '/') {
    path = path.slice(0, -1);
  }
  
  return path;
}

/**
 * Find a node in the filesystem by path
 */
function findNodeByPath(root: FileSystemNode, path: string): FileSystemNode | null {
  if (path === ROOT_PATH || path === '/') {
    return root;
  }
  
  // Remove root path prefix
  const relativePath = path.startsWith(ROOT_PATH)
    ? path.slice(ROOT_PATH.length)
    : path;
  
  // Split path into components
  const components = relativePath.split('/').filter(Boolean);
  
  let current: FileSystemNode | null = root;
  
  for (const component of components) {
    if (!current || current.type !== 'directory' || !current.children || !current.children[component]) {
      return null;
    }
    current = current.children[component];
  }
  
  return current;
}

/**
 * Build a directory tree from a node
 */
function buildDirectoryTree(node: FileSystemNode): DirectoryTreeResult {
  const result: DirectoryTreeResult = {
    name: node.name,
    type: node.type
  };
  
  if (node.type === 'directory') {
    result.children = Object.values(node.children || {}).map((child: FileSystemNode) => {
      return buildDirectoryTree(child);
    });
  }
  
  return result;
}

/**
 * Search for files matching a pattern
 */
function searchFiles(
  node: FileSystemNode,
  pattern: RegExp,
  excludePatterns: RegExp[],
  currentPath: string
): string[] {
  const results: string[] = [];
  
  // Check if this node should be excluded
  const shouldExclude = excludePatterns.some(ep => ep.test(node.name));
  if (shouldExclude) {
    return results;
  }
  
  // Check if this node matches the pattern
  if (pattern.test(node.name)) {
    results.push(currentPath);
  }
  
  // Recursively search children if this is a directory
  if (node.type === 'directory' && node.children) {
    for (const [name, child] of Object.entries(node.children)) {
      const childPath = `${currentPath}/${name}`;
      results.push(...searchFiles(child, pattern, excludePatterns, childPath));
    }
  }
  
  return results;
}

// Type guard functions
function isReadFileArgs(args: unknown): args is ReadFileArgs {
  return typeof args === 'object' && args !== null && 'path' in args && typeof (args as Record<string, unknown>).path === 'string';
}

function isListDirectoryArgs(args: unknown): args is ListDirectoryArgs {
  return typeof args === 'object' && args !== null && 'path' in args && typeof (args as Record<string, unknown>).path === 'string';
}

function isSearchFilesArgs(args: unknown): args is SearchFilesArgs {
  return typeof args === 'object' && args !== null && 
         'path' in args && typeof (args as Record<string, unknown>).path === 'string' &&
         'pattern' in args && typeof (args as Record<string, unknown>).pattern === 'string';
}

// Helper function to create error responses
function createError(id: string | number, code: number, message: string): McpServerResponse {
  return {
    error: {
      code,
      message,
      data: null
    },
    id: String(id)
  };
}
