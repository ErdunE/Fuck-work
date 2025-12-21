"""
Test the decision engine with various job scenarios.
"""

from database import SessionLocal
from database.models import Job
from decision_engine import explain_job_decision
import random


def test_high_score_job():
    """Test job with high authenticity score"""
    db = SessionLocal()
    
    # Find job with score > 80
    job = db.query(Job).filter(Job.authenticity_score >= 80).first()
    
    if job:
        decision = explain_job_decision(job)
        print("\n" + "=" * 80)
        print(f"HIGH SCORE JOB: {job.title}")
        print(f"Company: {job.company_name}")
        print(f"Score: {job.authenticity_score}")
        print(f"\nDECISION: {decision.decision}")
        print(f"\nREASONS:")
        for reason in decision.reasons:
            print(f"  + {reason}")
        if decision.risks:
            print(f"\nRISKS:")
            for risk in decision.risks:
                print(f"  - {risk}")
        print("=" * 80)
    
    db.close()


def test_low_score_job():
    """Test job with low authenticity score"""
    db = SessionLocal()
    
    # Find job with score < 50
    job = db.query(Job).filter(Job.authenticity_score < 50).first()
    
    if job:
        decision = explain_job_decision(job)
        print("\n" + "=" * 80)
        print(f"LOW SCORE JOB: {job.title}")
        print(f"Company: {job.company_name}")
        print(f"Score: {job.authenticity_score}")
        print(f"\nDECISION: {decision.decision}")
        print(f"\nREASONS:")
        for reason in decision.reasons:
            print(f"  + {reason}")
        if decision.risks:
            print(f"\nRISKS:")
            for risk in decision.risks:
                print(f"  - {risk}")
        print("=" * 80)
    
    db.close()


def test_random_jobs(count=5):
    """Test random sample of jobs"""
    db = SessionLocal()
    
    jobs = db.query(Job).all()
    sample = random.sample(jobs, min(count, len(jobs)))
    
    print("\n" + "=" * 80)
    print(f"RANDOM SAMPLE ({count} jobs)")
    print("=" * 80)
    
    for job in sample:
        decision = explain_job_decision(job)
        print(f"\n{job.title[:60]}...")
        print(f"  Score: {job.authenticity_score} | Decision: {decision.decision}")
        print(f"  Reasons: {len(decision.reasons)} | Risks: {len(decision.risks)}")
    
    print("=" * 80)
    
    db.close()


if __name__ == "__main__":
    print("Testing Decision Engine")
    test_high_score_job()
    test_low_score_job()
    test_random_jobs(10)

