import os
import time
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from github import Github

class UltimateCopilotResult(BaseModel):
    category_labels: list[str] = Field(description="List of labels to apply. Examples: bug, enhancement, documentation, dependencies")
    summary: str = Field(description="A clear 2-sentence executive summary of the issue, PR, or code change.")
    bug_reproduction_usefulness: str = Field(description="If an issue/bug, provide exact terminal commands or code blocks to reproduce it. If a PR, write 'N/A'.")
    codebase_grounded_analysis: str = Field(description="Deep technical analysis. Pinpoint where the bug lives in the code tree or review the logic changes.")
    release_note_draft: str = Field(description="A perfectly formatted release note entry detailing this change.")
    newcomer_onboarding_guide: str = Field(description="Tailored, warm instructions showing a first-time contributor how to set up their local environment and handle this file area.")

def analyze_any_git_event(title: str, body: str, repo_name: str, event_type: str, pr_diff: str = "") -> tuple[dict, float]:
    # Track model processing start window to compute exact operational efficiency latency
    start_time = time.time()
    
    gh = Github(os.environ.get("GITHUB_TOKEN"))
    codebase_context = ""
    
    # Securely attempt to pull file maps for grounded context
    try:
        repo = gh.get_repo(repo_name)
        contents = repo.get_contents("")
        file_list = [content.path for content in contents]
        codebase_context += f"Repository File Tree Structure: {', '.join(file_list)}\n\n"
        
        for target_file in ["Dockerfile", "docker-compose.yml", "package.json", "requirements.txt", "README.md"]:
            if target_file in file_list:
                file_content = repo.get_contents(target_file).decoded_content.decode("utf-8")
                codebase_context += f"--- FILE PATH: {target_file} ---\n{file_content[:1500]}\n\n"
    except Exception as e:
        # Fallback structural mock framework if handling a local frontend simulation run without a real repo connection
        codebase_context += f"[Simulation Mode/Local Run] Basic structural configuration baseline active. Context extraction bypass: {str(e)}\n"

    # Connect to NVIDIA Nemotron-3 Super via OpenRouter free cluster tier
    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model="nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0.1
    )

    system_prompt = (
        "You are 'RepoGuard Ultimate Copilot', an AI agent powered by NVIDIA Nemotron-3 Super 120B.\n"
        "Your goal is to fully manage repository triage and maintainer assistance for non-profits and civic-tech teams.\n\n"
        "Analyze the incoming event. Provide thorough triage documentation, reproduction steps, release notes, and a newcomer onboarding guide. "
        "You must respond strictly using the requested JSON schema format."
    )

    user_content = (
        f"=== COPIOUS CODEBASE GROUNDING CONTEXT ===\n{codebase_context}\n\n"
        f"=== INCOMING EVENT DETAILS ===\n"
        f"Event Classification Type: {event_type}\n"
        f"Event Identifier/Title: {title}\n"
        f"Event Text/Description Body:\n{body}\n"
    )
    
    if event_type == "pull_request" and pr_diff:
        user_content += f"\n=== LIVE CODE PATCH CHANGES (GIT DIFF) ===\n{pr_diff}\n"

    # Direct fix: Pass the raw dictionary JSON schema parameters to bypass LangChain's internal type check crash
    structured_llm = llm.with_structured_output({
        "name": "UltimateCopilotResult",
        "description": "Structured triage output for open-source repositories",
        "parameters": UltimateCopilotResult.model_json_schema()
    })
    
    response = structured_llm.invoke([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ])
    
    elapsed_latency = round(time.time() - start_time, 2)
    return response, elapsed_latency