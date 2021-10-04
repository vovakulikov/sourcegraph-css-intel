import sourcegraph from 'sourcegraph';
import gql from 'tagged-template-noop'

import { IFileMatch, IGraphQLResponseRoot, IQuery } from './schema';

export const queryGraphQL = async <T = IQuery>(query: string, variables: object = {}): Promise<T> => {
    const { data, errors }: IGraphQLResponseRoot = await sourcegraph.graphQL.execute(
        query,
        variables
    )

    if (errors && errors.length > 0) {
        throw new Error(errors.map(error => error.message).join('\n'))
    }
    return data as any as T
}

const HighlightCode = gql`
    query HighlightedFile(
        $repoName: String!
        $commitID: String!
        $filePath: String!
        $disableTimeout: Boolean!
        $ranges: [HighlightLineRange!]!
    ) {
        repository(name: $repoName) {
            commit(rev: $commitID) {
                file(path: $filePath) {
                    highlight(disableTimeout: $disableTimeout) {
                        aborted
                        lineRanges(ranges: $ranges)
                    }
                }
            }
        }
    }
`

interface FetchHighlightedFileLineRangesProps {
    repoName: string
    commitID: string
    filePath: string
    disableTimeout?: boolean
    ranges: {
       startLine: number,
       endLine: number
    }
}

export const fetchHighlightedFileLineRanges = async (props: FetchHighlightedFileLineRangesProps): Promise<string[]> => {
    const result = await queryGraphQL(HighlightCode, props)

    if (!result.repository?.commit?.file?.highlight.lineRanges) {
        throw new Error('No previews :(')
    }

    return result.repository?.commit?.file?.highlight.lineRanges[0]
}

const Search = gql`
    query Search($query: String!) {
        search(query: $query) {
            results {
                results {
                    __typename

                    ... on FileMatch {

                        lineMatches {
                            preview
                            lineNumber
                        }

                        repository {
                            name
                            defaultBranch {
                                name
                                target {
                                    oid
                                }
                            }

                        }

                        file {
                            path
                        }
                    }
                }
            }
        }
    }
`

interface SearchQueryProps {
    query: string
}

interface SearchVariableDefinitionResult {
    lineNumber: number,
    repository: string,
    filePath: string,
    commitID: string,
}

export const searchVariableDefinition = async (props: SearchQueryProps): Promise<SearchVariableDefinitionResult> => {
    const result = await queryGraphQL(Search, props)
    const fileMatches: IFileMatch[] = result.search
        ?.results
        .results
        .filter((result): result is IFileMatch  => result.__typename === 'FileMatch') ?? []

    if (fileMatches.length === 0) {
        throw new Error('No matches :(');
    }

    const firstMatch = fileMatches[0]

    return {
        lineNumber: firstMatch.lineMatches[0].lineNumber,
        repository: firstMatch.repository.name,
        filePath: firstMatch.file.path,
        commitID: firstMatch.repository.defaultBranch?.target.oid ?? ''
    }
}
