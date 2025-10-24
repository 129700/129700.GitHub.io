# 129700.GitHub.io
我的小网站
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>用户输入示例页面</title>
  <style>
    /* 简单美化样式 */
    .form-container {
      width: 500px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    .form-item {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, textarea, select {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      padding: 10px 20px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #3367d6;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h2>用户信息填写</h2>
    <!-- 表单容器 -->
    <div class="form-item">
      <label for="username">用户名：</label>
      <input type="text" id="username" placeholder="请输入用户名">
    </div>

    <div class="form-item">
      <label for="pwd">密码：</label>
      <input type="password" id="pwd" placeholder="请输入密码">
    </div>

    <div class="form-item">
      <label>性别：</label>
      <input type="radio" name="gender" value="male" id="male">
      <label for="male">男</label>
      <input type="radio" name="gender" value="female" id="female">
      <label for="female">女</label>
    </div>

    <div class="form-item">
      <label for="hobby">兴趣爱好：</label>
      <input type="checkbox" name="hobby" value="game" id="game">
      <label for="game">游戏</label>
      <input type="checkbox" name="hobby" value="read" id="read">
      <label for="read">阅读</label>
      <input type="checkbox" name="hobby" value="sport" id="sport">
      <label for="sport">运动</label>
    </div>

    <div class="form-item">
      <label for="city">所在城市：</label>
      <select id="city">
        <option value="">请选择</option>
        <option value="beijing">北京</option>
        <option value="shanghai">上海</option>
        <option value="guangzhou">广州</option>
      </select>
    </div>

    <div class="form-item">
      <label for="remark">备注：</label>
      <textarea id="remark" rows="4" placeholder="请输入备注信息"></textarea>
    </div>

    <button onclick="getAllInput()">提交信息</button>
  </div>

  <script>
    // 获取所有输入内容的函数
    function getAllInput() {
      // 1. 获取用户名和密码
      const username = document.getElementById("username").value;
      const pwd = document.getElementById("pwd").value;

      // 2. 获取性别（单选框）
      const gender = document.querySelector('input[name="gender"]:checked')?.value || "未选择";

      // 3. 获取兴趣爱好（复选框）
      const hobbies = [];
      document.querySelectorAll('input[name="hobby"]:checked').forEach(item => {
        hobbies.push(item.value);
      });
      const hobbyStr = hobbies.length > 0 ? hobbies.join("、") : "未选择";

      // 4. 获取城市（下拉框）
      const city = document.getElementById("city").value || "未选择";

      // 5. 获取备注
      const remark = document.getElementById("remark").value || "无";

      // 弹出结果
      alert(`
        用户名：${username}
        密码：${pwd}
        性别：${gender}
        兴趣爱好：${hobbyStr}
        所在城市：${city}
        备注：${remark}
      `);
    }
  </script>
</body>
</html>
