import unittest


class ApiSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import sys

        sys.path.insert(0, "backend")
        from app.main import app
        from fastapi.testclient import TestClient

        cls.client = TestClient(app)

    def test_full_flow(self):
        csv = "x,y,group,c1,c2\n1,2,A,a,u\n2,4,A,b,u\n3,3,B,a,v\n4,9,B,b,v\n"
        files = {"file": ("test.csv", csv.encode("utf-8"), "text/csv")}
        resp = self.client.post("/api/v2/upload", files=files, data={"industry": "finance"})
        self.assertEqual(resp.status_code, 200, resp.text)
        sid = resp.json()["session_id"]

        resp = self.client.post("/api/v2/chat", json={"session_id": sid, "message": "请做相关性分析 X=x,Y=y"})
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertIn(resp.json()["analysis"]["method"], {"pearson", "spearman"})

        resp = self.client.post("/api/v2/chat", json={"session_id": sid, "message": "请做差异检验 group=group,value=y"})
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertIn(resp.json()["analysis"]["method"], {"t_test", "mann_whitney_u"})

        resp = self.client.post("/api/v2/chat", json={"session_id": sid, "message": "请做卡方检验 X=c1,Y=c2"})
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertEqual(resp.json()["analysis"]["method"], "chi_square")

        resp = self.client.get("/api/v2/sessions")
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertGreaterEqual(resp.json()["total"], 1)

        resp = self.client.get(f"/api/v2/session/{sid}")
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertEqual(resp.json()["session_id"], sid)

        resp = self.client.post("/api/v2/export", json={"session_id": sid, "format": "md", "include_charts": True})
        self.assertEqual(resp.status_code, 200, resp.text)
        url = resp.json()["download_url"]
        path = url.split("http://testserver")[-1]

        resp = self.client.get(path)
        self.assertEqual(resp.status_code, 200, resp.text)

        resp = self.client.delete(f"/api/v2/session/{sid}")
        self.assertEqual(resp.status_code, 204, resp.text)


if __name__ == "__main__":
    unittest.main()

