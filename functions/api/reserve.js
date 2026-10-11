export async function onRequest(context) {
  const { request, env } = context;

  // 只允许 POST 请求（提交表单）
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 1. 接收前端发来的邮箱数据
    const { email } = await request.json();

    // 2. 服务端验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: '请输入有效的邮箱地址' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. 将邮箱存入 D1 数据库（表名：reservations）
    const stmt = env.DB.prepare('INSERT INTO reservations (email) VALUES (?)');
    await stmt.bind(email).run();

    // 4. 存入成功，返回提示
    return new Response(JSON.stringify({ success: true, message: '预约成功！' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    // 5. 如果邮箱重复（你刚才建的 UNIQUE 约束会在这里起作用）
    if (e.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ success: true, message: '您已经预约过了！' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 6. 其他服务器错误
    return new Response(JSON.stringify({ error: '服务器内部错误，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
