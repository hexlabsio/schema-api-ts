import hydraSpec from "../src/hydra";
const accountServiceSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Account Service API',
        version: '1.0',
    },
    paths: {
        '/account/{accountId}': {
            get: {
                parameters: [
                    { in: "path", required: true, name: 'accountId', schema: { type: 'string' } }
                ],
                responses: { '200': { '$ref': '#/components/responses/AccountSuccess' }, '404': { '$ref': '#/components/responses/NotBuiltYet' } },
            },
            patch: {
                parameters: [
                    { in: "path", required: true, name: 'accountId', schema: { type: 'string' } }
                ],
                responses: { '200': { '$ref': '#/components/responses/AccountSuccess' } }
            },
            delete: {
                parameters: [
                    { in: "path", required: true, name: 'accountId', schema: { type: 'string' } }
                ],
                responses: { '501': { '$ref': '#/components/responses/NotBuiltYet' } }
            }
        },
        '/account/status': {
            get: { responses: { '501': { '$ref': '#/components/responses/NotBuiltYet' } } },
            post: { responses: { '501': { '$ref': '#/components/responses/NotBuiltYet' } } }
        }
    },
    components: {
        responses: {
            'NotBuiltYet': {
                description: 'Not Built Yet',
                content: {
                    'application/text': {
                        schema: { type: 'string' }
                    }
                }
            },
            'AccountSuccess': {
                description: '',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/AccountResource' }
                    }
                }
            }
        },
        schemas: {
            ...hydraSpec,
            AccountResource: { title: 'AccountResource', allOf: [{ '$ref': '#/components/schemas/HydraResource' }, { '$ref': '#/components/schemas/Account' }] },
            Account: {
                type: 'object',
                title: 'Account',
                additionalProperties: false,
                required: ['awsAccountId', 'created', 'alias'],
                properties: {
                    awsAccountId: { type: 'string' },
                    created: { type: 'string' },
                    alias: { type: 'string' }
                }
            }
        }
    }
};
export default accountServiceSpec;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWV4YW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzY2hlbWEtZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVMsTUFBTSxjQUFjLENBQUM7QUFHckMsTUFBTSxrQkFBa0IsR0FBUTtJQUM5QixPQUFPLEVBQUUsT0FBTztJQUNoQixJQUFJLEVBQUU7UUFDSixLQUFLLEVBQUUscUJBQXFCO1FBQzVCLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7SUFDRCxLQUFLLEVBQUU7UUFDTCxzQkFBc0IsRUFBRTtZQUN0QixHQUFHLEVBQUU7Z0JBQ0gsVUFBVSxFQUFFO29CQUNWLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxFQUFDO2lCQUM1RTtnQkFDRCxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsdUNBQXVDLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsb0NBQW9DLEVBQUUsRUFBQzthQUNsSTtZQUNELEtBQUssRUFBRTtnQkFDTCxVQUFVLEVBQUU7b0JBQ1YsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLEVBQUM7aUJBQzVFO2dCQUNELFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSx1Q0FBdUMsRUFBRSxFQUFDO2FBQ3pFO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLFVBQVUsRUFBRTtvQkFDVixFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsRUFBQztpQkFDNUU7Z0JBQ0QsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLG9DQUFvQyxFQUFFLEVBQUU7YUFDdkU7U0FDRjtRQUNELGlCQUFpQixFQUFFO1lBQ2pCLEdBQUcsRUFBRSxFQUFDLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxvQ0FBb0MsRUFBRSxFQUFFLEVBQUU7WUFDOUUsSUFBSSxFQUFFLEVBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLG9DQUFvQyxFQUFFLEVBQUUsRUFBRTtTQUNoRjtLQUNGO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsU0FBUyxFQUFFO1lBQ1QsYUFBYSxFQUFFO2dCQUNiLFdBQVcsRUFBRSxlQUFlO2dCQUM1QixPQUFPLEVBQUU7b0JBQ1Asa0JBQWtCLEVBQUU7d0JBQ2xCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7cUJBQzNCO2lCQUNGO2FBQ0Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsT0FBTyxFQUFFO29CQUNQLGtCQUFrQixFQUFFO3dCQUNsQixNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsc0NBQXNDLEVBQUU7cUJBQzNEO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELE9BQU8sRUFBRTtZQUNQLEdBQUcsU0FBUztZQUNaLGVBQWUsRUFBRSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFDLE1BQU0sRUFBRSxvQ0FBb0MsRUFBQyxFQUFFLEVBQUMsTUFBTSxFQUFFLDhCQUE4QixFQUFDLENBQUMsRUFBRTtZQUNoSixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLG9CQUFvQixFQUFFLEtBQUs7Z0JBQzNCLFFBQVEsRUFBRSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO2dCQUM5QyxVQUFVLEVBQUU7b0JBQ1YsWUFBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQztvQkFDOUIsT0FBTyxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQztvQkFDekIsS0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQztpQkFDeEI7YUFDRjtTQUNGO0tBQ0Y7Q0FDRixDQUFBO0FBQ0QsZUFBZSxrQkFBa0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBoeWRyYVNwZWMgZnJvbSBcIi4uL3NyYy9oeWRyYVwiO1xuaW1wb3J0IHtPQVN9IGZyb20gXCIuLi9zcmMvb2FzXCI7XG5cbmNvbnN0IGFjY291bnRTZXJ2aWNlU3BlYzogT0FTID0ge1xuICBvcGVuYXBpOiAnMy4wLjAnLFxuICBpbmZvOiB7XG4gICAgdGl0bGU6ICdBY2NvdW50IFNlcnZpY2UgQVBJJyxcbiAgICB2ZXJzaW9uOiAnMS4wJyxcbiAgfSxcbiAgcGF0aHM6IHtcbiAgICAnL2FjY291bnQve2FjY291bnRJZH0nOiB7XG4gICAgICBnZXQ6IHtcbiAgICAgICAgcGFyYW1ldGVyczogW1xuICAgICAgICAgIHsgaW46IFwicGF0aFwiLCByZXF1aXJlZDogdHJ1ZSwgbmFtZTogJ2FjY291bnRJZCcsIHNjaGVtYTogeyB0eXBlOiAnc3RyaW5nJ319XG4gICAgICAgIF0sXG4gICAgICAgIHJlc3BvbnNlczogeyAnMjAwJzogeyAnJHJlZic6ICcjL2NvbXBvbmVudHMvcmVzcG9uc2VzL0FjY291bnRTdWNjZXNzJyB9LCAnNDA0JzogeyAnJHJlZic6ICcjL2NvbXBvbmVudHMvcmVzcG9uc2VzL05vdEJ1aWx0WWV0JyB9fSxcbiAgICAgIH0sXG4gICAgICBwYXRjaDoge1xuICAgICAgICBwYXJhbWV0ZXJzOiBbXG4gICAgICAgICAgeyBpbjogXCJwYXRoXCIsIHJlcXVpcmVkOiB0cnVlLCBuYW1lOiAnYWNjb3VudElkJywgc2NoZW1hOiB7IHR5cGU6ICdzdHJpbmcnfX1cbiAgICAgICAgXSxcbiAgICAgICAgcmVzcG9uc2VzOiB7ICcyMDAnOiB7ICckcmVmJzogJyMvY29tcG9uZW50cy9yZXNwb25zZXMvQWNjb3VudFN1Y2Nlc3MnIH19XG4gICAgICB9LFxuICAgICAgZGVsZXRlOiB7XG4gICAgICAgIHBhcmFtZXRlcnM6IFtcbiAgICAgICAgICB7IGluOiBcInBhdGhcIiwgcmVxdWlyZWQ6IHRydWUsIG5hbWU6ICdhY2NvdW50SWQnLCBzY2hlbWE6IHsgdHlwZTogJ3N0cmluZyd9fVxuICAgICAgICBdLFxuICAgICAgICByZXNwb25zZXM6IHsgJzUwMSc6IHsgJyRyZWYnOiAnIy9jb21wb25lbnRzL3Jlc3BvbnNlcy9Ob3RCdWlsdFlldCcgfSB9XG4gICAgICB9XG4gICAgfSxcbiAgICAnL2FjY291bnQvc3RhdHVzJzoge1xuICAgICAgZ2V0OiB7cmVzcG9uc2VzOiB7ICc1MDEnOiB7ICckcmVmJzogJyMvY29tcG9uZW50cy9yZXNwb25zZXMvTm90QnVpbHRZZXQnIH0gfSB9LFxuICAgICAgcG9zdDoge3Jlc3BvbnNlczogeyAnNTAxJzogeyAnJHJlZic6ICcjL2NvbXBvbmVudHMvcmVzcG9uc2VzL05vdEJ1aWx0WWV0JyB9IH0gfVxuICAgIH1cbiAgfSxcbiAgY29tcG9uZW50czoge1xuICAgIHJlc3BvbnNlczoge1xuICAgICAgJ05vdEJ1aWx0WWV0Jzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ05vdCBCdWlsdCBZZXQnLFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgJ2FwcGxpY2F0aW9uL3RleHQnOiB7XG4gICAgICAgICAgICBzY2hlbWE6IHsgdHlwZTogJ3N0cmluZycgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdBY2NvdW50U3VjY2Vzcyc6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiB7XG4gICAgICAgICAgICBzY2hlbWE6IHsgJyRyZWYnOiAnIy9jb21wb25lbnRzL3NjaGVtYXMvQWNjb3VudFJlc291cmNlJyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBzY2hlbWFzOiB7XG4gICAgICAuLi5oeWRyYVNwZWMsXG4gICAgICBBY2NvdW50UmVzb3VyY2U6IHsgdGl0bGU6ICdBY2NvdW50UmVzb3VyY2UnLCBhbGxPZjogW3snJHJlZic6ICcjL2NvbXBvbmVudHMvc2NoZW1hcy9IeWRyYVJlc291cmNlJ30sIHsnJHJlZic6ICcjL2NvbXBvbmVudHMvc2NoZW1hcy9BY2NvdW50J31dIH0sXG4gICAgICBBY2NvdW50OiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0FjY291bnQnLFxuICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG4gICAgICAgIHJlcXVpcmVkOiBbJ2F3c0FjY291bnRJZCcsICdjcmVhdGVkJywgJ2FsaWFzJ10sXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhd3NBY2NvdW50SWQ6IHt0eXBlOiAnc3RyaW5nJ30sXG4gICAgICAgICAgY3JlYXRlZDoge3R5cGU6ICdzdHJpbmcnfSxcbiAgICAgICAgICBhbGlhczoge3R5cGU6ICdzdHJpbmcnfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5leHBvcnQgZGVmYXVsdCBhY2NvdW50U2VydmljZVNwZWM7XG4iXX0=