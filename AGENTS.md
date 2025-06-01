# Development Process for CA Ed Code MCP Server

This document outlines the development process for the CA Ed Code MCP Server project, including guidelines for state preservation, task management, and collaboration across sessions and agents.

## Project Overview

The CA Ed Code MCP Server provides a Model Context Protocol interface for fetching California Education Code sections from the official legislative website. The server exposes a simple tool that accepts an Ed Code citation (e.g., "15278") and returns the content along with the source URL.

## Development Principles

### 1. State Preservation
- **TODO.md**: Maintain a living document of pending tasks. Only include incomplete items.
- **Clean Git History**: Each development phase should end with a clean git tree and updated documentation.
- **Session Handoffs**: Document current state and next steps clearly for continuity.

### 2. Documentation Standards
- **README.md**: Keep updated with accurate project description, setup instructions, and usage examples.
- **Code Comments**: Minimal, focusing on why rather than what.
- **Commit Messages**: Clear, descriptive messages following conventional commit format.

### 3. Quality Assurance
- **Linting**: All code must pass ruff checks before commits.
- **Testing**: All new functionality requires corresponding tests.
- **Type Checking**: Use type hints throughout the codebase.

## Development Workflow

### Phase 1: Project Setup
1. Initialize git repository
2. Create project structure
3. Set up Python virtual environment
4. Configure linting and testing infrastructure
5. Document setup process in README.md

### Phase 2: Core Implementation
1. Implement web scraping for CA Ed Code
2. Create MCP server with fetch tool
3. Add caching mechanism
4. Implement error handling

### Phase 3: Testing & Refinement
1. Write comprehensive tests
2. Add integration tests with sample citations
3. Performance optimization
4. Documentation updates

### Phase 4: Release Preparation
1. Final documentation review
2. Create usage examples
3. Ensure all tests pass
4. Clean git history

## Task Management

### Using TODO.md
- List only pending tasks
- Include priority levels (High/Medium/Low)
- Update immediately when tasks are completed
- Structure tasks by development phase

### Git Workflow
- Commit frequently with clear messages
- Each phase ends with a tagged commit
- Never commit with failing tests or lint errors
- Use conventional commit format: `type(scope): description`

## Testing Strategy

### Unit Tests
- Test scraper functionality with mock responses
- Test cache behavior
- Test MCP server tool registration

### Integration Tests
- Test actual Ed Code fetching (with rate limiting)
- Test error cases (invalid citations, network errors)
- Test MCP protocol compliance

## Environment Setup

### Requirements
- Python 3.11+
- Virtual environment (venv)
- Git

### Development Dependencies
- mcp (or fastmcp)
- beautifulsoup4
- requests
- pytest
- ruff
- pre-commit

## Code Style Guidelines

### Python Standards
- Follow PEP 8
- Use type hints
- Prefer explicit over implicit
- Keep functions focused and small

### MCP Implementation
- Single responsibility per tool
- Clear tool descriptions
- Comprehensive error messages
- Minimal external dependencies

## Debugging and Troubleshooting

### Common Issues
1. **SSL/TLS Errors**: CA legislature site may have certificate issues
2. **Rate Limiting**: Implement exponential backoff
3. **HTML Structure Changes**: Monitor for website updates

### Debug Mode
- Include verbose logging option
- Log all HTTP requests in debug mode
- Provide clear error messages to MCP clients

## Performance Considerations

### Caching Strategy
- Cache successful responses for 24 hours
- Use file-based cache for simplicity
- Include cache invalidation mechanism

### Request Optimization
- Implement connection pooling
- Set appropriate timeouts
- Handle partial content gracefully

## Security Considerations

### Input Validation
- Sanitize Ed Code citations
- Prevent path traversal in cache
- Validate all user inputs

### Network Security
- Use HTTPS only
- Verify SSL certificates
- No credential storage

## Maintenance Guidelines

### Monitoring
- Log errors for analysis
- Track request patterns
- Monitor CA website changes

### Updates
- Regular dependency updates
- Adapt to website structure changes
- Maintain backwards compatibility

## Collaboration Notes

When picking up this project:
1. Read TODO.md for current tasks
2. Check git log for recent changes
3. Run tests to verify environment
4. Update TODO.md before ending session

## Version Control Conventions

### Branch Strategy
- `main`: Stable releases only
- `develop`: Active development
- Feature branches: `feature/description`
- Bugfix branches: `fix/description`

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code restructuring
- `chore`: Maintenance tasks