import os
import asyncio
from fastapi import FastAPI, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from github import Github
from dotenv import load_dotenv

from agent import analyze_any_git_event

load_dotenv()

app = FastAPI(title="Nemotron Ultimate Copilot Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gh = Github(os.environ.get("GITHUB_TOKEN"))
connected_sockets = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_sockets.append(websocket)
    print(f" Frontend dashboard connected! Active viewers: {len(connected_sockets)}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_sockets.remove(websocket)
        print("Frontend dashboard disconnected.")

async def broadcast_to_frontend(data: dict):
    for socket in connected_sockets:
        try:
            await socket.send_json(data)
        except Exception:
            pass

def execute_triage_pipeline(title: str, body: str, repo_name: str, event_type: str, item_number: int, is_simulation: bool = False):
    print(f"\n⚡ Processing {event_type} #{item_number} | Simulation Mode: {is_simulation}...")
    
    # Notify React UI that processing is underway
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(broadcast_to_frontend({
        "status": "processing",
        "number": item_number,
        "title": title,
        "type": event_type,
        "repo": repo_name
    }))

    try:
        pr_diff = ""
        if not is_simulation:
            try:
                repo = gh.get_repo(repo_name)
                git_handle = repo.get_pull(item_number) if event_type == "pull_request" else repo.get_issue(item_number)
                if event_type == "pull_request":
                    files = git_handle.get_files()
                    pr_diff = "\n".join([f"File: {f.filename}\nPatch:\n{f.patch}" for f in files if f.patch])
            except Exception as git_err:
                print(f"⚠️ GitHub synchronization bypassed or offline: {str(git_err)}")
                is_simulation = True

        # Run the updated Nemotron engine
        res, latency = analyze_any_git_event(title, body, repo_name, event_type, pr_diff)

        # Unpack values securely directly out of the dictionary layout response
        labels = res.get("category_labels", ["triage-needed"])
        summary = res.get("summary", "")
        repro = res.get("bug_reproduction_usefulness", "N/A")
        analysis = res.get("codebase_grounded_analysis", "")
        release_note = res.get("release_note_draft", "")
        onboarding = res.get("newcomer_onboarding_guide", "")

        # Write data back onto the live GitHub issue thread if running in production mode
        if not is_simulation:
            try:
                markdown_report = (
                    f"## 🤖 RepoGuard Copilot Report [{event_type.upper()} #{item_number}]\n\n"
                    f"**📋 Executive Summary:**\n{summary}\n\n"
                    f"--- \n"
                    f"### 🔬 Codebase Grounded Review & Analysis\n{analysis}\n\n"
                    f"### 🧪 Reliable Bug Reproduction Steps\n{repro}\n\n"
                    f"### 📝 Automated Release Note Draft\n```text\n{release_note}\n```\n\n"
                    f"### 🌱 Newcomer Friendly Onboarding Guide\n{onboarding}\n\n"
                    f"_*Engineered by NVIDIA Nemotron-3 Super 120B reasoning model workflows._*"
                )
                git_handle.create_comment(markdown_report)
                for label in labels:
                    git_handle.add_to_labels(label.strip())
            except Exception as write_err:
                print(f"❌ Could not write back comment to platform: {str(write_err)}")

        # Stream full analysis results back to the React client screen dashboard
        loop.run_until_complete(broadcast_to_frontend({
            "status": "completed",
            "type": event_type,
            "number": item_number,
            "title": title,
            "repo": repo_name,
            "labels": labels,
            "summary": summary,
            "analysis": analysis,
            "repro": repro,
            "release_note": release_note,
            "onboarding": onboarding,
            "latency": latency,
            "cost": "0.00 (Free Tier Allocation)"
        }))
        print(f"✅ Pipeline loop completed successfully for #{item_number}!")
        loop.close()

    except Exception as e:
        print(f"❌ Critical breakdown inside pipeline task engine execution: {str(e)}")

@app.post("/webhook")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    action = payload.get("action")
    if action != "opened":
        return {"status": "ignored"}
        
    is_pr = "pull_request" in payload
    event_type = "pull_request" if is_pr else "issue"
    git_object_data = payload["pull_request"] if is_pr else payload["issue"]
    
    background_tasks.add_task(
        execute_triage_pipeline,
        git_object_data.get("title", ""),
        git_object_data.get("body", "") or "",
        payload["repository"]["full_name"],
        event_type,
        git_object_data.get("number", 1),
        False
    )
    return {"status": "accepted"}

@app.post("/simulate")
async def trigger_simulated_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    background_tasks.add_task(
        execute_triage_pipeline,
        payload.get("title", ""),
        payload.get("body", ""),
        payload.get("repo", ""),
        payload.get("type", "issue"),
        payload.get("number", 999),
        True
    )
    return {"status": "simulation_initialized"}