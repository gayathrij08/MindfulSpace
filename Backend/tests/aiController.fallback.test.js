describe('AI chat fallback behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = '';
    process.env.GOOGLE_AI_API_KEY = '';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
  });

  test('returns a friendly local fallback instead of a generic service error', async () => {
    const { generateChatResponse } = require('../controllers/aiController');

    const req = {
      body: { message: 'hello', language: 'en' },
      user: undefined
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await generateChatResponse(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      fallback: true,
      response: expect.stringMatching(/(What's on your mind|Tell me what|Okay, I'm listening|You don't need the perfect words)/i)
    }));
  });

  test('keeps educational suicide-related questions as low risk', () => {
    const { classifyCrisisRisk } = require('../services/crisisService');

    expect(classifyCrisisRisk('What does suicide prevention mean?')).toBe('low');
    expect(classifyCrisisRisk('I want to kill myself.')).toBe('high');
  });
});
