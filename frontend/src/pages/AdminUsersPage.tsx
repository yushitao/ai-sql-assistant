import {
	useEffect,
	useState,
} from "react";

import axios from "axios";

import {
	App,
	Button,
	Card,
	Input,
	Modal,
	Select,
	Space,
	Switch,
	Table,
	Tag,
	Typography,
} from "antd";

import type {
	TableColumnsType,
} from "antd";

import {
	useNavigate,
} from "react-router-dom";

import {
	createAdminUser,
	getAdminUsers,
	updateAdminUserRole,
	updateAdminUserStatus,
	type AdminUser,
	type UserRole,
} from "../api/adminUsers";

function AdminUsersPage() {
	const navigate =
		useNavigate();

	const {
		message: messageApi,
	} = App.useApp();

	const [
		users,
		setUsers,
	] = useState<AdminUser[]>([]);

	const [
		loading,
		setLoading,
	] = useState(false);

	const [
		page,
		setPage,
	] = useState(1);

	const [
		pageSize,
		setPageSize,
	] = useState(20);

	const [
		total,
		setTotal,
	] = useState(0);

	const [
		keywordInput,
		setKeywordInput,
	] = useState("");

	const [
		keyword,
		setKeyword,
	] = useState("");

	const [
		roleFilter,
		setRoleFilter,
	] = useState<
	UserRole | undefined
	>(undefined);

	const [
		statusFilter,
		setStatusFilter,
	] = useState<
	boolean | undefined
	>(undefined);

	const [
		createModalOpen,
		setCreateModalOpen,
	] = useState(false);

	const[
		username,
		setUsername,
	] = useState("");

	const [
		email,
		setEmail,
	] = useState("");

	const [
		password,
		setPassword,
	] = useState("");

	const [
		createRole,
		setCreateRole,
	] = useState<UserRole>(
		"user",
	);

	const [
		createLoading,
		setCreateLoading,
	] = useState(false);

	const loadUsers =
		async () => {
			setLoading(true);

			try {
				const data =
					await getAdminUsers({
						page,
						page_size:
							pageSize,
						keyword:
							keyword
						|| undefined,
						role:
							roleFilter,
						is_active:
							statusFilter,
					});

					setUsers(data.items);
					setTotal(data.total);
			} catch {
				messageApi.error(
					"用户列表加载失败",
				);
			} finally {
				setLoading(false);
			}
		};

	useEffect(() => {
		void loadUsers();
	}, [
		page,
		pageSize,
		keyword,
		roleFilter,
		statusFilter,
	]);

	const updateUserInList = (
		updatedUser: AdminUser,
	) => {
		setUsers(
			(currentUsers) => 
			currentUsers.map(
				(user) =>
				user.id
				=== updatedUser.id
					? updatedUser
					: user,
			),
		);
	};

	const handleStatusChange =
		async (
			user: AdminUser,
			checked: boolean,
		) => {
			try {
				const updatedUser = 
					await updateAdminUserStatus(
						user.id,
						checked,
					);

				updateUserInList(
					updatedUser,
				);

				messageApi.success(
					checked
						? "用户已启用"
						: "用户已禁用",
				);
			} catch (error: unknown) {
				const detail =
					axios.isAxiosError(
						error
					)
						? error.response
						?.data?.detail
						: null;

				messageApi.error(
					typeof detail
					=== "string"
						? detail
						: "更新用户状态失败",
				);
			}
		};

	const handleRoleChange =
		async (
			user: AdminUser,
			role: UserRole,
		) => {
			try {
				const updatedUser =
					await updateAdminUserRole(
						user.id,
						role,
					);

				updateUserInList(
					updatedUser,
				);

				messageApi.success(
					"用户角色已更新",
				);
			} catch (error: unknown) {
				const detail =
					axios.isAxiosError(
						error
					)
						? error.response
						?.data?.detail
						: null;

				messageApi.error(
					typeof detail
					=== "string"
						? detail
						: "更新用户角色失败",
				);
			}
		};

	const closeCreateModal =
		() => {
			setCreateModalOpen(
				false,
			);

			setUsername("");
			setEmail("");
			setPassword("");
			setCreateRole("user");
		};

	const handleCreateUser =
		async () => {
			const normalizedUsername =
				username.trim();

			const normalizedEmail =
				email.trim();

			if (!normalizedUsername) {
				messageApi.warning(
					"请输入用户名",
				);

				return;
			}

			if (password.length < 8) {
				messageApi.warning(
					"密码长度不能少于8位",
				);

				return;
			}

			setCreateLoading(true);

			try {
				await createAdminUser({
					username:
						normalizedUsername,
					email:
						normalizedEmail
					|| undefined,
					password,
					role:createRole,
				});

				messageApi.success(
					"用户创建成功",
				);

				closeCreateModal();

				setPage(1);

				if (page === 1) {
					void loadUsers();
				}
			} catch (error:unknown) {
				const detail =
					axios.isAxiosError(
						error
					)
						? error.response
						?.data?.detail
						: null;

				messageApi.error(
					typeof detail
					=== "string"
						? detail
						: "创建用户失败",
				);
			} finally {
				setCreateLoading(false);
			}
		};

	const columns:
		TableColumnsType<AdminUser> =
		[
			{
				title: "ID",
				dataIndex: "id",
				width: 80,
			},
			{
				title: "用户名",
				dataIndex:
					"username",
			},
			{
				title: "邮箱",
				dataIndex: "email",
				render: (
					value:
						| string
						| null,
				) =>
				value ?? "-",
			},
			{
				title: "角色",
				dataIndex: "role",
				width: 150,
				render: (
					role: UserRole,
					user,
				) => (
				<Select
					value={role}
					style={{
						width: 120,
					}}
					options={[
						{
							label: "USER",
							value: "user",
						},
						{
							label: "ADMIN",
							value: "admin",
						},
					]}
					onChange={(
						value: UserRole,
					) => {
						void handleRoleChange(
							user,
							value,
						);
					}}
				/>
				),
			},
			{
				title: "状态",
				dataIndex:
					"is_active",
				width: 130,
				render: (
					isActive: boolean,
					user,
				) => (
					<Space>
						<Switch
							checked={isActive}
							onChange={(
								checked,
							) => {
								void handleStatusChange(
									user,
									checked,
								);
							}}
						/>

						<Tag
							color={
								isActive
									? "green"
									: "red"
							}
						>
							{isActive
								? "启用"
								: "禁用"}
						</Tag>
					</Space>
				),
			},
			{
				title: "创建时间",
				dataIndex:
					"created_at",
				width: 190,
				render: (
					value: string,
				) =>
				new Date(
					value
				).toLocaleString(),
			},
		];

	return (
		<div
			style={{
				minHeight: "100vh",
				padding: 24,
				background: "#f5f5f5",
			}}
		>
			<Card>
				<Space
					orientation="vertical"
					size="large"
					style={{
						width: "100%",
					}}
				>
					<Space
						style={{
							width: "100%",
							justifyContent:
								"space-between",
						}}
					>
						<Typography.Title
							level={3}
							style={{
								margin: 0,
							}}
						>
							用户管理
						</Typography.Title>

						<Space>
							<Button
								onClick={() => {
									navigate(
										"/chat"
									);
								}}
							>
								返回聊天
							</Button>

							<Button
								type="primary"
								onClick={() => {
									setCreateModalOpen(
										true
									);
								}}
							>
								创建用户
							</Button>
						</Space>
					</Space>

					<Space wrap>
						<Input.Search
							allowClear
							placeholder={
								"搜索用户名或邮箱"
							}
							value={
								keywordInput
							}
							style={{
								width: 260,
							}}
							onChange={(
								event,
							) => {
								setKeywordInput(
									event.target.value
								);
							}}
							onSearch={() => {
								setPage(1);
								setKeyword(
									keywordInput
									.trim()
								);
							}}
						/>

						<Select
							allowClear
							placeholder="角色"
							style={{
								width: 140,
							}}
							options={[
								{
									label: "USER",
									value: "user",
								},
								{
									label: "ADMIN",
									value: "admin",
								},
							]}
							onChange={(
								value:
									| UserRole
									| undefined,
							) => {
								setPage(1);
								setRoleFilter(
									value
								);
							}}
						/>

						<Select
							allowClear
							placeholder="状态"
							style={{
								width: 140,
							}}
							options={[
								{
									label: "启用",
									value: true,
								},
								{
									label: "禁用",
									value: false,
								},
							]}
							onChange={(
								value:
									| boolean
									| undefined,
							) => {
								setPage(1);
								setStatusFilter(
									value
								);
							}}
						/>

						<Button
							onClick={() => {
								void loadUsers();
							}}
						>
							刷新
						</Button>
					</Space>

					<Table<AdminUser>
						rowKey="id"
						loading={loading}
						columns={columns}
						dataSource={users}
						pagination={{
							current: page,
							pageSize,
							total,
							showSizeChanger:
								true,
							showTotal: (
								count,
							) =>
							`共${count}个用户`,
							onChange: (
								nextPage,
								nextPageSize,
							) => {
								setPage(
									nextPageSize
									!== pageSize
										? 1
										: nextPage
								);

								setPageSize(
									nextPageSize
								);
							},
						}}
						/>
					</Space>
					</Card>

			<Modal
				title="创建用户"
				open={createModalOpen}
				okText="创建"
				cancelText="取消"
				confirmLoading={
					createLoading
				}
				onOk={() => {
					void handleCreateUser();
				}}
				onCancel={
					closeCreateModal
				}
			>
				<Space
					orientation="vertical"
					size="middle"
					style={{
						width: "100%",
					}}
				>
					<Input
						value={username}
						maxLength={50}
						placeholder="用户名"
						onChange={(event) => {
							setUsername(
								event.target.value
							);
						}}
					/>

					<Input
						value={email}
						maxLength={255}
						placeholder="邮箱"
						onChange={(event) => {
							setEmail(
								event.target.value
							);
						}}
					/>

					<Input.Password
						value={password}
						maxLength={128}
						placeholder={
							"初始密码，至少8位"
						}
						onChange={(event) => {
							setPassword(
								event.target.value
							);
						}}
					/>

					<Select
						value={createRole}
						style={{
							width: "100%",
						}}
						options={[
							{
								label: "普通用户",
								value: "user",
							},
							{
								label:"管理员",
								value: "admin",
							},
						]}
						onChange={(
							value: UserRole,
						) => {
							setCreateRole(
								value
							);
						}}
					/>
				</Space>
			</Modal>
				</div>
	);
}

export default AdminUsersPage;



